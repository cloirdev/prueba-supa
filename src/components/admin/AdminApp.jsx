import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import "@/styles/admin.css";
import AdminLogin from "./AdminLogin.jsx";
// import AdminInicio from "./AdminInicio.jsx";
import AdminEquipos from "./AdminEquipos.jsx";
import AdminTemporadas from "./AdminTemporadas.jsx";
import AdminPanel from "./AdminPanel.jsx";
import AdminPlantilla from "./AdminPlantilla.jsx";
import AdminCalendario from "./AdminCalendario.jsx";
import AdminNoticias from "./AdminNoticias.jsx";
import AdminJugadores from "./jugadores/AdminJugadores.jsx";
import AdminEntrenadores from "./AdminEntrenadores.jsx";
import AdminClasificacion from "./AdminClasificacion.jsx";
import FormNuevoEquipo from "./FormNuevoEquipo.jsx";

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
);

export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [equipoActual, setEquipoActual] = useState(null);
  const [temporadaActual, setTemporadaActual] = useState(null);
  const [vista, setVista] = useState("temporadas"); // ← empieza en temporadas

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) cargarPerfil(session.user.id);
      else setCargando(false);
    });
    supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session) cargarPerfil(session.user.id);
      else {
        setPerfil(null);
        setCargando(false);
      }
    });
  }, []);

  async function cargarPerfil(userId) {
    const { data } = await supabase
      .from("perfiles")
      .select("*")
      .eq("id", userId)
      .single();
    setPerfil(data);
    setCargando(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setPerfil(null);
    setEquipoActual(null);
    setTemporadaActual(null);
    setVista("temporadas");
  }

  if (cargando)
    return (
      <div style={{ padding: "40px", color: "var(--muted)" }}>Cargando...</div>
    );
  if (!session) return <AdminLogin supabase={supabase} />;

  const tieneEquipo = equipoActual && temporadaActual;
  const equipoLabel =
    equipoActual?.categorias?.nombre ?? equipoActual?.sponsor ?? "Equipo";

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "220px",
          background: "#0f172a",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "20px 16px",
            borderBottom: "0.5px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontSize: "15px", fontWeight: 800, color: "white" }}>
            CB <span style={{ color: "#F97316" }}>Jaca</span>
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.4)",
              marginTop: "3px",
            }}
          >
            Panel de administración
          </div>
        </div>

        <NavSection label="General">
          <NavItem
            label="Inicio"
            activa={vista === "temporadas"}
            onClick={() => {
              setEquipoActual(null);
              setTemporadaActual(null);
              setVista("temporadas");
            }}
          />
        </NavSection>

        {tieneEquipo && (
          <NavSection label={equipoLabel}>
            <NavItem
              label="Plantilla"
              activa={vista === "plantilla"}
              onClick={() => setVista("plantilla")}
            />
            <NavItem
              label="Calendario"
              activa={vista === "calendario"}
              onClick={() => setVista("calendario")}
            />
            <NavItem
              label="Clasificación"
              activa={vista === "clasificacion"}
              onClick={() => setVista("clasificacion")}
            />
            <NavItem
              label="Noticias"
              activa={vista === "noticias"}
              onClick={() => setVista("noticias")}
            />
          </NavSection>
        )}

        {perfil?.rol === "admin" && (
          <NavSection label="Admin">
            <NavItem
              label="Jugadores"
              activa={vista === "jugadores"}
              onClick={() => setVista("jugadores")}
            />
            <NavItem
              label="Entrenadores"
              activa={vista === "entrenadores"}
              onClick={() => setVista("entrenadores")}
            />
            <NavItem
              label="Nuevo equipo"
              activa={vista === "nuevoEquipo"}
              onClick={() => setVista("nuevoEquipo")}
            />
          </NavSection>
        )}

        <div
          style={{
            marginTop: "auto",
            padding: "16px",
            borderTop: "0.5px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "#F97316",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 800,
                color: "white",
                flexShrink: 0,
              }}
            >
              {session.user.email[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                {perfil?.nombre ?? session.user.email}
              </div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                {perfil?.rol}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              marginTop: "10px",
              width: "100%",
              background: "rgba(255,255,255,0.05)",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              padding: "7px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Main */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "var(--fondo)",
          overflow: "hidden",
        }}
      >
        {/* Topbar */}
        <div
          style={{
            background: "var(--card)",
            borderBottom: "0.5px solid var(--borde)",
            padding: "0 24px",
            height: "52px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: "var(--muted)",
            }}
          >
            {tieneEquipo ? (
              <>
                <span
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setEquipoActual(null);
                    setTemporadaActual(null);
                    setVista("temporadas");
                  }}
                >
                  Temporadas
                </span>
                <span>›</span>
                <span
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setEquipoActual(null);
                    setVista("equipos");
                  }}
                >
                  {temporadaActual?.nombre}
                </span>
                <span>›</span>
                <span style={{ color: "var(--texto)", fontWeight: 500 }}>
                  {equipoLabel}
                </span>
              </>
            ) : temporadaActual ? (
              <>
                <span
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setTemporadaActual(null);
                    setVista("temporadas");
                  }}
                >
                  Temporadas
                </span>
                <span>›</span>
                <span style={{ color: "var(--texto)", fontWeight: 500 }}>
                  {temporadaActual.nombre}
                </span>
              </>
            ) : (
              <span style={{ color: "var(--texto)", fontWeight: 500 }}>
                Temporadas
              </span>
            )}
          </div>
          {tieneEquipo && (
            <button
              onClick={() => {
                setEquipoActual(null);
                setTemporadaActual(null);
                setVista("temporadas");
              }}
              style={{
                fontSize: "12px",
                padding: "6px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                border: "0.5px solid var(--borde)",
                background: "transparent",
                color: "var(--muted)",
              }}
            >
              Cambiar equipo
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          {/* FLUJO PRINCIPAL: Temporadas → Equipos → Calendario */}
          {vista === "temporadas" && (
            <AdminTemporadas
              supabase={supabase}
              onSelect={(temporada) => {
                setTemporadaActual(temporada);
                setVista("equipos");
              }}
            />
          )}

          {vista === "equipos" && temporadaActual && (
            <AdminEquipos
              supabase={supabase}
              perfil={perfil}
              temporada={temporadaActual}
              onSelect={(equipo) => {
                setEquipoActual(equipo);
                setVista("calendario");
              }}
              onBack={() => {
                setTemporadaActual(null);
                setVista("temporadas");
              }}
            />
          )}

          {/* Vistas de equipo */}
          {vista === "plantilla" && tieneEquipo && (
            <AdminPlantilla
              supabase={supabase}
              perfil={perfil}
              equipo={equipoActual}
              temporada={temporadaActual}
              onBack={() => setVista("calendario")}
            />
          )}
          {vista === "calendario" && tieneEquipo && (
            <AdminCalendario
              supabase={supabase}
              perfil={perfil}
              equipo={equipoActual}
              temporada={temporadaActual}
              onBack={() => {
                setEquipoActual(null);
                setVista("equipos");
              }}
            />
          )}

          {vista === "clasificacion" && tieneEquipo && (
            <AdminClasificacion
              supabase={supabase}
              equipo={equipoActual}
              temporada={temporadaActual}
            />
          )}

          {vista === "noticias" && tieneEquipo && (
            <AdminNoticias
              supabase={supabase}
              perfil={perfil}
              equipo={equipoActual}
              temporada={temporadaActual}
              onBack={() => setVista("calendario")}
            />
          )}

          {/* Admin */}
          {vista === "nuevoEquipo" && perfil?.rol === "admin" && (
            <FormNuevoEquipo
              supabase={supabase}
              onCreado={() => setVista("temporadas")}
              onCancelar={() => setVista("temporadas")}
            />
          )}
          {vista === "jugadores" && perfil?.rol === "admin" && (
            <AdminJugadores supabase={supabase} perfil={perfil} />
          )}
          {vista === "entrenadores" && perfil?.rol === "admin" && (
            <AdminEntrenadores supabase={supabase} perfil={perfil} />
          )}
        </div>
      </div>
    </div>
  );
}

function NavSection({ label, children }) {
  return (
    <div
      style={{
        padding: "12px 0",
        borderBottom: "0.5px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          color: "rgba(255,255,255,0.3)",
          textTransform: "uppercase",
          letterSpacing: ".08em",
          padding: "0 16px",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function NavItem({ label, activa, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: activa ? "8px 14px" : "8px 16px",
        fontSize: "13px",
        cursor: "pointer",
        transition: "all .15s",
        color: activa ? "#F97316" : "rgba(255,255,255,0.6)",
        background: activa ? "rgba(249,115,22,0.15)" : "transparent",
        borderLeft: activa ? "2px solid #F97316" : "2px solid transparent",
      }}
    >
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "currentColor",
          opacity: 0.6,
          flexShrink: 0,
        }}
      />
      {label}
    </div>
  );
}
