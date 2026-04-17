import { useState, useEffect } from "react";

export default function AdminTemporadas({
  supabase,
  equipo,
  onSelect,
  onBack,
}) {
  const [temporadas, setTemporadas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        // Un equipo pertenece a una temporada, pero puede haber varios
        // equipos del mismo club en distintas temporadas
        // Buscamos todos los equipos que comparten categoria_id con el equipo actual
        const { data, error } = await supabase
          .from("equipos")
          .select(
            `
            id,
            categoria_id,
            sponsor,
            temporadas (id, nombre),
            competiciones (nombre)
          `,
          )
          .eq("categoria_id", equipo.categoria_id);

        if (error) throw error;

        const sorted = (data ?? [])
          .filter((e) => e.temporadas)
          .sort((a, b) =>
            b.temporadas.nombre.localeCompare(a.temporadas.nombre),
          );

        setTemporadas(sorted);
      } catch (e) {
        console.error("Error en cargar:", e);
      } finally {
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
      <h1 style={{ marginBottom: "4px" }}>
        {equipo.categorias?.nombre ?? equipo.sponsor ?? "Equipo"}
      </h1>
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
        {temporadas.length === 0 && (
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>
            No hay temporadas registradas.
          </p>
        )}
        {temporadas.map((e, idx) => (
          <div
            key={e.id}
            onClick={() => onSelect(e)}
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
                {e.temporadas.nombre}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  marginTop: "2px",
                }}
              >
                {e.competiciones?.nombre ?? "—"}
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
