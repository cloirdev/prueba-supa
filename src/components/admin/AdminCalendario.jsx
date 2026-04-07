import { useState, useEffect } from "react";
import AdminPartido from "./AdminPartido.jsx";

export default function AdminCalendario({
  supabase,
  perfil,
  equipo,
  temporada,
  onBack,
}) {
  const [partidos, setPartidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [partidoSeleccionado, setPartidoSeleccionado] = useState(null);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    const { data } = await supabase
      .from("partidos")
      .select("*")
      .eq("inscripcion_id", temporada.id)
      .order("fecha", { ascending: true });
    setPartidos(data ?? []);
    setCargando(false);
  }

  if (partidoSeleccionado)
    return (
      <AdminPartido
        supabase={supabase}
        perfil={perfil}
        equipo={equipo}
        temporada={temporada}
        partido={partidoSeleccionado}
        onBack={() => {
          setPartidoSeleccionado(null);
          cargar();
        }}
      />
    );

  if (cargando)
    return <p style={{ color: "var(--muted)" }}>Cargando partidos...</p>;

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--muted)",
          cursor: "pointer",
          fontSize: "13px",
          marginBottom: "24px",
          padding: 0,
        }}
      >
        ← Volver
      </button>

      <h1 style={{ marginBottom: "4px" }}>Calendario</h1>
      <p
        style={{
          color: "var(--muted)",
          fontSize: "14px",
          marginBottom: "24px",
        }}
      >
        {equipo.nombre} · {temporada.temporadas.nombre}
      </p>

      {partidos.length === 0 && (
        <p style={{ color: "var(--muted)" }}>
          No hay partidos registrados para esta temporada.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {partidos.map((p) => {
          const victoria = p.puntos_favor > p.puntos_contra;
          const fechaFormateada = p.fecha
            ? new Date(p.fecha).toLocaleDateString("es-ES", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })
            : "Sin fecha";
          return (
            <div
              key={p.id}
              onClick={() => setPartidoSeleccionado(p)}
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>
                  {p.es_local ? "vs" : "@"} {p.rival}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--muted)",
                    marginTop: "2px",
                  }}
                >
                  {fechaFormateada} · J{p.jornada} ·{" "}
                  {p.es_local ? "Local" : "Visitante"}
                </div>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                {p.puntos_favor !== null ? (
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: victoria ? "var(--naranja)" : "var(--azul)",
                    }}
                  >
                    {p.puntos_favor} – {p.puntos_contra}
                  </div>
                ) : (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--muted)",
                      padding: "2px 8px",
                      borderRadius: "20px",
                      background: "var(--color-background-secondary)",
                    }}
                  >
                    Pendiente
                  </span>
                )}
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                  ›
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
