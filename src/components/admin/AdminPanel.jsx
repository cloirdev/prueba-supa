import { useState } from "react";
import AdminPlantilla from "./AdminPlantilla.jsx";
import AdminCalendario from "./AdminCalendario.jsx";
import AdminNoticias from "./AdminNoticias.jsx";

export default function AdminPanel({
  supabase,
  perfil,
  equipo,
  temporada,
  onBack,
}) {
  const [seccion, setSeccion] = useState(null);

  if (seccion === "plantilla")
    return (
      <AdminPlantilla
        supabase={supabase}
        perfil={perfil}
        equipo={equipo}
        temporada={temporada}
        onBack={() => setSeccion(null)}
      />
    );

  if (seccion === "calendario")
    return (
      <AdminCalendario
        supabase={supabase}
        perfil={perfil}
        equipo={equipo}
        temporada={temporada}
        onBack={() => setSeccion(null)}
      />
    );

  if (seccion === "noticias")
    return (
      <AdminNoticias
        supabase={supabase}
        perfil={perfil}
        equipo={equipo}
        temporada={temporada}
        onBack={() => setSeccion(null)}
      />
    );

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
        {temporada.competiciones.nombre} · {temporada.nombre}
      </p>

      <div style={{ display: "flex", gap: "12px" }}>
        <div
          onClick={() => setSeccion("plantilla")}
          className="card"
          style={{ flex: 1, textAlign: "center", cursor: "pointer" }}
        >
          <div style={{ fontSize: "28px", marginBottom: "10px" }}>👥</div>
          <div
            style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}
          >
            Plantilla
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)" }}>
            Gestionar jugadores
          </div>
        </div>

        <div
          onClick={() => setSeccion("calendario")}
          className="card"
          style={{ flex: 1, textAlign: "center", cursor: "pointer" }}
        >
          <div style={{ fontSize: "28px", marginBottom: "10px" }}>📅</div>
          <div
            style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}
          >
            Calendario
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)" }}>
            Partidos y estadísticas
          </div>
        </div>

        <div
          onClick={() => setSeccion("noticias")}
          className="card"
          style={{ flex: 1, textAlign: "center", cursor: "pointer" }}
        >
          <div style={{ fontSize: "28px", marginBottom: "10px" }}>📰</div>
          <div
            style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}
          >
            Noticias
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)" }}>
            Crónicas y noticias
          </div>
        </div>
      </div>

      {perfil?.rol === "admin" && (
        <div style={{ marginTop: "24px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".06em",
              color: "var(--muted)",
              marginBottom: "10px",
            }}
          >
            Solo admin
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <div
              className="card"
              style={{ flex: 1, opacity: 0.5, cursor: "not-allowed" }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "13px",
                  marginBottom: "4px",
                }}
              >
                Estadísticas
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                Próximamente
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
