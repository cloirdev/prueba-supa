import { useState, useEffect } from "react";
import AdminEquipos from "./AdminEquipos.jsx";

export default function AdminTemporadas({
  supabase,
  perfil,
  temporadaInicial,
  onSelectEquipo,
  onBack,
}) {
  const [temporadas, setTemporadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [temporadaSeleccionada, setTemporadaSeleccionada] = useState(
    temporadaInicial ?? null,
  );

  useEffect(() => {
    async function cargar() {
      try {
        const { data, error } = await supabase
          .from("temporadas")
          .select("id, nombre")
          .order("nombre", { ascending: false });
        if (error) throw error;
        setTemporadas(data ?? []);
        if (temporadaInicial) {
          // Si venimos de "cambiar equipo" o del breadcrumb, respetamos la
          // temporada que ya se estaba viendo en vez de saltar a la primera.
          const encontrada = (data ?? []).find(
            (t) => t.id === temporadaInicial.id,
          );
          setTemporadaSeleccionada(encontrada ?? temporadaInicial);
        } else if (data?.length) {
          setTemporadaSeleccionada(data[0]);
        }
      } catch (e) {
        console.error("Error cargando temporadas:", e);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  if (cargando)
    return <p style={{ color: "var(--muted)" }}>Cargando temporadas...</p>;

  return (
    <div>
      {onBack && (
        <button onClick={onBack} className="adm-back-btn">
          ← Volver
        </button>
      )}
      <h1 className="adm-page-title">Temporadas</h1>
      <p className="adm-page-subtitle">Selecciona la temporada</p>

      <div className="adm-split-layout">
        {/* Columna izquierda: lista de temporadas */}
        <div className="adm-list adm-split-lista">
          {temporadas.length === 0 && (
            <p className="adm-empty">No hay temporadas registradas.</p>
          )}
          {temporadas.map((t, idx) => {
            const esSeleccionada = t.id === temporadaSeleccionada?.id;
            return (
              <div
                key={t.id}
                onClick={() => setTemporadaSeleccionada(t)}
                className={`card adm-card-row adm-card-clickable adm-temporada-card${
                  esSeleccionada ? " adm-temporada-card--seleccionada" : ""
                }`}
              >
                <div>
                  <div className="adm-card-title">{t.nombre}</div>
                </div>
                <span
                  className={`adm-pill ${idx === 0 ? "adm-pill--active" : "adm-pill--muted"}`}
                >
                  {idx === 0 ? "Activa" : "Histórico"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Columna derecha: equipos de la temporada seleccionada */}
        <div className="adm-split-detalle">
          {temporadaSeleccionada ? (
            <>
              <div className="adm-split-detalle-header">
                <h2 className="adm-split-detalle-titulo">
                  Equipos · {temporadaSeleccionada.nombre}
                </h2>
              </div>
              <AdminEquipos
                supabase={supabase}
                perfil={perfil}
                temporada={temporadaSeleccionada}
                onSelect={(equipo) =>
                  onSelectEquipo(equipo, temporadaSeleccionada)
                }
                embedded
              />
            </>
          ) : (
            <p className="adm-empty">
              Selecciona una temporada para ver sus equipos.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
