import { useState, useEffect } from "react";

export default function AdminTemporadas({
  supabase,
  equipo,
  onSelect,
  onBack,
}) {
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const { data, error: err } = await supabase
          .from("inscripciones")
          .select(
            `
          id,
          temporadas (id, nombre),
          competiciones (nombre)
        `,
          )
          .eq("equipo_id", equipo.id);

        const sorted = (data ?? [])
          .filter((i) => i.temporadas)
          .sort((a, b) =>
            b.temporadas.nombre.localeCompare(a.temporadas.nombre),
          );

        setInscripciones(sorted);
        setCargando(false);
      } catch (e) {
        console.error("Error en cargar:", e);
        setCargando(false);
      }
    }
    cargar();
  }, [equipo]);
  if (cargando)
    return <p style={{ color: "var(--muted)" }}>Cargando temporadas...</p>;

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

      <h1 style={{ marginBottom: "4px" }}>{equipo.nombre}</h1>
      <p
        style={{
          color: "var(--muted)",
          fontSize: "14px",
          marginBottom: "32px",
        }}
      >
        Selecciona la temporada
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "500px",
        }}
      >
        {inscripciones.map((i, idx) => (
          <div
            key={i.id}
            onClick={() => onSelect(i)}
            className="card"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px" }}>
                {i.temporadas.nombre}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  marginTop: "2px",
                }}
              >
                {i.competiciones.nombre}
              </div>
            </div>
            <span
              style={{
                fontSize: "10px",
                padding: "2px 8px",
                borderRadius: "20px",
                fontWeight: 700,
                background:
                  idx === 0 ? "#fff7ed" : "var(--color-background-secondary)",
                color: idx === 0 ? "#c2410c" : "var(--muted)",
              }}
            >
              {idx === 0 ? "Activa" : "Histórico"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
