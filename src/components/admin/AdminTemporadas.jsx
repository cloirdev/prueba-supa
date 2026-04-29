import { useState, useEffect } from "react";

export default function AdminTemporadas({ supabase, onSelect, onBack }) {
  const [temporadas, setTemporadas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const { data, error } = await supabase
          .from("temporadas")
          .select("id, nombre")
          .order("nombre", { ascending: false });
        if (error) throw error;
        setTemporadas(data ?? []);
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
      <div className="adm-list" style={{ maxWidth: "500px", gap: "10px" }}>
        {temporadas.length === 0 && (
          <p className="adm-empty">No hay temporadas registradas.</p>
        )}
        {temporadas.map((t, idx) => (
          <div
            key={t.id}
            onClick={() => onSelect(t)}
            className="card adm-card-row adm-card-clickable"
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
        ))}
      </div>
    </div>
  );
}
