import { useState, useEffect } from "react";

export default function AdminEquipos({ supabase, perfil, onSelect }) {
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      let d = [];

      if (perfil?.rol === "admin") {
        const { data } = await supabase.from("equipos").select(`
            id,
            categoria_id,
            sponsor,
            temporadas (nombre),
            categorias (nombre),
            competiciones (nombre)
          `);
        d = data ?? [];
      } else if (perfil?.equipo_ids?.length) {
        const { data } = await supabase
          .from("equipos")
          .select(
            `
            id,
            categoria_id
            sponsor,
            temporadas (nombre),
            categorias (nombre),
            competiciones (nombre)
          `,
          )
          .in("id", perfil.equipo_ids);
        d = data ?? [];
      }

      setEquipos(
        d.sort((a, b) =>
          (b.temporadas?.nombre ?? "").localeCompare(
            a.temporadas?.nombre ?? "",
          ),
        ),
      );
      setCargando(false);
    }

    if (perfil) cargar();
  }, [perfil]);

  if (cargando)
    return <p style={{ color: "var(--muted)" }}>Cargando equipos...</p>;

  return (
    <div>
      <h1 style={{ marginBottom: "4px" }}>Mis equipos</h1>
      <p
        style={{
          color: "var(--muted)",
          fontSize: "14px",
          marginBottom: "32px",
        }}
      >
        Selecciona el equipo que quieres gestionar
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "12px",
        }}
      >
        {equipos.map((e) => (
          <div
            key={e.id}
            onClick={() => onSelect(e)}
            className="card"
            style={{ cursor: "pointer" }}
          >
            <div style={{ fontSize: "22px", marginBottom: "8px" }}>🏀</div>
            <div
              style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}
            >
              {e.sponsor ?? e.categorias?.nombre ?? "—"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>
              {e.categorias?.nombre} · {e.competiciones?.nombre}
            </div>
            <span
              style={{
                display: "inline-block",
                marginTop: "8px",
                fontSize: "10px",
                padding: "2px 8px",
                borderRadius: "20px",
                fontWeight: 700,
                background: "#eff6ff",
                color: "#1d4ed8",
              }}
            >
              {e.temporadas?.nombre}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
