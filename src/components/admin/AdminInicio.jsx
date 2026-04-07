import { useState, useEffect } from "react";

export default function AdminInicio({ supabase, perfil, onIrAEquipos }) {
  const [stats, setStats] = useState({ partidos: 0, victorias: 0 });
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      let equiposData = [];
      if (perfil?.rol === "admin") {
        const { data } = await supabase
          .from("equipos")
          .select("*")
          .order("nombre");
        equiposData = data ?? [];
      } else if (perfil?.equipo_ids?.length) {
        const { data } = await supabase
          .from("equipos")
          .select("*")
          .in("id", perfil.equipo_ids);
        equiposData = data ?? [];
      }
      setEquipos(equiposData);

      const { data: partidos } = await supabase
        .from("partidos")
        .select("puntos_favor, puntos_contra")
        .not("puntos_favor", "is", null);

      const total = partidos?.length ?? 0;
      const victorias =
        partidos?.filter((p) => p.puntos_favor > p.puntos_contra).length ?? 0;
      setStats({ partidos: total, victorias });
      setCargando(false);
    }
    if (perfil) cargar();
  }, [perfil]);

  if (cargando) return <p style={{ color: "var(--muted)" }}>Cargando...</p>;

  return (
    <div>
      <div
        style={{
          background: "#0f172a",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: "white",
              marginBottom: "4px",
            }}
          >
            Bienvenido, {perfil?.nombre ?? "Admin"}
          </h1>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
            Temporada 2025-26
          </p>
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          {[
            { num: stats.partidos, label: "Partidos" },
            { num: stats.victorias, label: "Victorias" },
            { num: stats.partidos - stats.victorias, label: "Derrotas" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div
                style={{ fontSize: "24px", fontWeight: 800, color: "#F97316" }}
              >
                {s.num}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: ".05em",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".08em",
          color: "#F97316",
          marginBottom: "12px",
        }}
      >
        Mis equipos
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "10px",
          marginBottom: "24px",
        }}
      >
        {equipos.map((e) => (
          <div
            key={e.id}
            onClick={onIrAEquipos}
            className="card"
            style={{ cursor: "pointer" }}
          >
            <div style={{ fontSize: "20px", marginBottom: "8px" }}>🏀</div>
            <div
              style={{ fontWeight: 700, fontSize: "14px", marginBottom: "3px" }}
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
