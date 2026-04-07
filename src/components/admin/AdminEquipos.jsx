import { useState, useEffect } from "react";

export default function AdminEquipos({ supabase, perfil, onSelect }) {
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      let data = [];
      if (perfil?.rol === "admin") {
        const { data: d } = await supabase
          .from("equipos")
          .select("*")
          .order("nombre");
        data = d ?? [];
      } else if (perfil?.equipo_ids?.length) {
        const { data: d } = await supabase
          .from("equipos")
          .select("*")
          .in("id", perfil.equipo_ids)
          .order("nombre");
        data = d ?? [];
      }
      setEquipos(data);
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
              {e.nombre}
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>
              {e.categoria}
            </div>
            <span
              style={{
                display: "inline-block",
                marginTop: "8px",
                fontSize: "10px",
                padding: "2px 8px",
                borderRadius: "20px",
                fontWeight: 700,
                background: e.categoria === "senior" ? "#fff7ed" : "#eff6ff",
                color: e.categoria === "senior" ? "#c2410c" : "#1d4ed8",
              }}
            >
              {e.categoria}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
