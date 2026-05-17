import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import "@/styles/admin.css";
import AdminLogin from "./AdminLogin.jsx";
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
import AdminClubes from "./AdminClubes.jsx";
import AdminEquiposRivales from "./AdminEquiposRivales.jsx";

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
);

// ── Sidebar theme tokens ──────────────────────────────────────────────────────
function sidebarTokens(tema) {
  if (tema === "dark") {
    return {
      bg: "#0f172a",
      border: "rgba(255,255,255,0.08)",
      logoText: "white",
      subtitle: "rgba(255,255,255,0.4)",
      sectionLabel: "rgba(255,255,255,0.3)",
      navText: "rgba(255,255,255,0.6)",
      userEmail: "rgba(255,255,255,0.7)",
      userRole: "rgba(255,255,255,0.3)",
      logoutBg: "rgba(255,255,255,0.05)",
      logoutColor: "rgba(255,255,255,0.5)",
      collapseBtn: "rgba(255,255,255,0.15)",
      collapseBtnHover: "rgba(255,255,255,0.25)",
      collapseBtnColor: "rgba(255,255,255,0.6)",
    };
  }
  return {
    bg: "#f8fafc",
    border: "rgba(0,0,0,0.08)",
    logoText: "#0f172a",
    subtitle: "rgba(0,0,0,0.4)",
    sectionLabel: "rgba(0,0,0,0.35)",
    navText: "rgba(0,0,0,0.55)",
    userEmail: "rgba(0,0,0,0.75)",
    userRole: "rgba(0,0,0,0.35)",
    logoutBg: "rgba(0,0,0,0.05)",
    logoutColor: "rgba(0,0,0,0.45)",
    collapseBtn: "rgba(0,0,0,0.08)",
    collapseBtnHover: "rgba(0,0,0,0.14)",
    collapseBtnColor: "rgba(0,0,0,0.5)",
  };
}

export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [equipoActual, setEquipoActual] = useState(null);
  const [temporadaActual, setTemporadaActual] = useState(null);
  const [vista, setVista] = useState("temporadas");
  const [tema, setTema] = useState(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem("tema") || "light";
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const tk = sidebarTokens(tema);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema);
    localStorage.setItem("tema", tema);
  }, [tema]);

  function toggleTema() {
    setTema((t) => (t === "dark" ? "light" : "dark"));
  }

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

  const sidebarW = sidebarCollapsed ? "56px" : "220px";

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div
        style={{
          width: sidebarW,
          background: tk.bg,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          overflow: "hidden",
          transition: "width 0.25s ease",
          borderRight: `0.5px solid ${tk.border}`,
        }}
      >
        {/* Logo row */}
        <div
          style={{
            padding: "0 12px",
            borderBottom: `0.5px solid ${tk.border}`,
            height: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: sidebarCollapsed ? "center" : "space-between",
            flexShrink: 0,
          }}
        >
          {!sidebarCollapsed && (
            <div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 800,
                  color: tk.logoText,
                }}
              >
                CB <span style={{ color: "#F97316" }}>Jaca</span>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: tk.subtitle,
                  marginTop: "2px",
                }}
              >
                Panel de administración
              </div>
            </div>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed((c) => !c)}
            title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
            style={{
              background: tk.collapseBtn,
              border: "none",
              borderRadius: "6px",
              width: "28px",
              height: "28px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: tk.collapseBtnColor,
              flexShrink: 0,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = tk.collapseBtnHover)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = tk.collapseBtn)
            }
          >
            {/* chevron icon — flips direction */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              style={{
                transform: sidebarCollapsed ? "rotate(0deg)" : "rotate(180deg)",
                transition: "transform 0.25s ease",
              }}
            >
              <path
                d="M9 3L5 7L9 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Nav sections */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          <NavSection label="General" collapsed={sidebarCollapsed} tk={tk}>
            <NavItem
              label="Inicio"
              icon="⌂"
              activa={vista === "temporadas"}
              collapsed={sidebarCollapsed}
              onClick={() => {
                setEquipoActual(null);
                setTemporadaActual(null);
                setVista("temporadas");
              }}
            />
          </NavSection>

          {tieneEquipo && (
            <NavSection
              label={equipoLabel}
              collapsed={sidebarCollapsed}
              tk={tk}
            >
              <NavItem
                label="Equipo"
                icon="🏀"
                activa={vista === "equipo"}
                collapsed={sidebarCollapsed}
                onClick={() => setVista("equipo")}
              />
              <NavItem
                label="Plantilla"
                icon="👥"
                activa={vista === "plantilla"}
                collapsed={sidebarCollapsed}
                onClick={() => setVista("plantilla")}
              />
              <NavItem
                label="Calendario"
                icon="📅"
                activa={vista === "calendario"}
                collapsed={sidebarCollapsed}
                onClick={() => setVista("calendario")}
              />
              <NavItem
                label="Clasificación"
                icon="🏆"
                activa={vista === "clasificacion"}
                collapsed={sidebarCollapsed}
                onClick={() => setVista("clasificacion")}
              />
              <NavItem
                label="Noticias"
                icon="📰"
                activa={vista === "noticias"}
                collapsed={sidebarCollapsed}
                onClick={() => setVista("noticias")}
              />
            </NavSection>
          )}

          {perfil?.rol === "admin" && (
            <NavSection label="Admin" collapsed={sidebarCollapsed} tk={tk}>
              <NavItem
                label="Jugadores"
                icon="🏅"
                activa={vista === "jugadores"}
                collapsed={sidebarCollapsed}
                onClick={() => setVista("jugadores")}
              />
              <NavItem
                label="Entrenadores"
                icon="📋"
                activa={vista === "entrenadores"}
                collapsed={sidebarCollapsed}
                onClick={() => setVista("entrenadores")}
              />
              <NavItem
                label="Clubes"
                icon="🏛️"
                activa={vista === "clubes"}
                collapsed={sidebarCollapsed}
                onClick={() => setVista("clubes")}
              />
              <NavItem
                label="Equipos rivales"
                icon="⚔️"
                activa={vista === "rivales"}
                collapsed={sidebarCollapsed}
                onClick={() => setVista("rivales")}
              />
              <NavItem
                label="Nuevo equipo"
                icon="➕"
                activa={vista === "nuevoEquipo"}
                collapsed={sidebarCollapsed}
                onClick={() => setVista("nuevoEquipo")}
              />
            </NavSection>
          )}
        </div>

        {/* Footer: user + theme toggle + logout */}
        <div
          style={{
            padding: sidebarCollapsed ? "12px 0" : "16px",
            borderTop: `0.5px solid ${tk.border}`,
            display: "flex",
            flexDirection: "column",
            alignItems: sidebarCollapsed ? "center" : "stretch",
            gap: "8px",
          }}
        >
          {/* Avatar + info row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: sidebarCollapsed ? 0 : "8px",
              justifyContent: sidebarCollapsed ? "center" : "flex-start",
            }}
          >
            {/* Avatar */}
            <div
              title={perfil?.nombre ?? session.user.email}
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

            {!sidebarCollapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "12px",
                      color: tk.userEmail,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {perfil?.nombre ?? session.user.email}
                  </div>
                  <div style={{ fontSize: "10px", color: tk.userRole }}>
                    {perfil?.rol}
                  </div>
                </div>

                {/* Theme toggle — only visible when expanded */}
                <button
                  onClick={toggleTema}
                  aria-label="Cambiar tema"
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 200 200"
                    style={{ overflow: "visible" }}
                  >
                    <defs>
                      <mask id="hole-admin">
                        <rect width="100%" height="100%" fill="white" />
                        <circle
                          r="80"
                          cx={tema === "dark" ? 140 : 230}
                          cy={tema === "dark" ? 60 : -30}
                          fill="black"
                          style={{ transition: "cx 0.5s ease, cy 0.5s ease" }}
                        />
                      </mask>
                      <filter id="blur-admin">
                        <feDropShadow
                          dx="0"
                          dy="0"
                          stdDeviation="8"
                          floodColor={tema === "dark" ? "white" : "#334155"}
                        />
                      </filter>
                    </defs>
                    <g filter="url(#blur-admin)">
                      <circle
                        fill={tema === "dark" ? "white" : "#334155"}
                        r="80"
                        cx="100"
                        cy="100"
                        mask="url(#hole-admin)"
                      />
                    </g>
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Theme toggle in collapsed mode */}
          {sidebarCollapsed && (
            <button
              onClick={toggleTema}
              aria-label="Cambiar tema"
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 200 200"
                style={{ overflow: "visible" }}
              >
                <defs>
                  <mask id="hole-admin-c">
                    <rect width="100%" height="100%" fill="white" />
                    <circle
                      r="80"
                      cx={tema === "dark" ? 140 : 230}
                      cy={tema === "dark" ? 60 : -30}
                      fill="black"
                      style={{ transition: "cx 0.5s ease, cy 0.5s ease" }}
                    />
                  </mask>
                  <filter id="blur-admin-c">
                    <feDropShadow
                      dx="0"
                      dy="0"
                      stdDeviation="8"
                      floodColor={tema === "dark" ? "white" : "#334155"}
                    />
                  </filter>
                </defs>
                <g filter="url(#blur-admin-c)">
                  <circle
                    fill={tema === "dark" ? "white" : "#334155"}
                    r="80"
                    cx="100"
                    cy="100"
                    mask="url(#hole-admin-c)"
                  />
                </g>
              </svg>
            </button>
          )}

          {/* Logout */}
          {!sidebarCollapsed ? (
            <button
              onClick={logout}
              style={{
                width: "100%",
                background: tk.logoutBg,
                border: "none",
                color: tk.logoutColor,
                padding: "7px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Cerrar sesión
            </button>
          ) : (
            <button
              onClick={logout}
              title="Cerrar sesión"
              style={{
                background: tk.logoutBg,
                border: "none",
                color: tk.logoutColor,
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
              }}
            >
              ↩
            </button>
          )}
        </div>
      </div>

      {/* ── Main ────────────────────────────────────────────────────────── */}
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
                setVista("equipo");
              }}
              onBack={() => {
                setTemporadaActual(null);
                setVista("temporadas");
              }}
            />
          )}
          {vista === "plantilla" && tieneEquipo && (
            <AdminPlantilla
              supabase={supabase}
              perfil={perfil}
              equipo={equipoActual}
              temporada={temporadaActual}
              onBack={() => setVista("calendario")}
            />
          )}
          {vista === "equipo" && tieneEquipo && (
            <AdminPanel
              supabase={supabase}
              perfil={perfil}
              equipo={equipoActual}
              temporada={temporadaActual}
              onBack={() => {
                setEquipoActual(null);
                setVista("equipos");
              }}
              onIrA={(seccion) => setVista(seccion)}
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
          {vista === "clubes" && perfil?.rol === "admin" && (
            <AdminClubes supabase={supabase} perfil={perfil} />
          )}
          {vista === "rivales" && perfil?.rol === "admin" && (
            <AdminEquiposRivales supabase={supabase} perfil={perfil} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── NavSection ────────────────────────────────────────────────────────────────
function NavSection({ label, children, collapsed, tk }) {
  return (
    <div
      style={{
        padding: "12px 0",
        borderBottom: `0.5px solid ${tk.border}`,
      }}
    >
      {!collapsed && (
        <div
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: tk.sectionLabel,
            textTransform: "uppercase",
            letterSpacing: ".08em",
            padding: "0 16px",
            marginBottom: "4px",
          }}
        >
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

// ── NavItem ───────────────────────────────────────────────────────────────────
function NavItem({ label, icon, activa, onClick, collapsed, tk }) {
  // tk is not passed here — NavItem reads its own colours from props
  // We need tk passed down; using a simpler approach: hardcode active orange,
  // inactive depends on collapsed tooltip only. Colors stay CSS-variable-free
  // since sidebar bg is custom. Pass tk down if needed, but for now active
  // state is enough differentiation.
  return (
    <div
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: collapsed ? 0 : "10px",
        padding: collapsed ? "10px 0" : activa ? "8px 14px" : "8px 16px",
        fontSize: "13px",
        cursor: "pointer",
        transition: "all .15s",
        color: activa ? "#F97316" : "rgba(128,128,128,0.8)",
        background: activa ? "rgba(249,115,22,0.12)" : "transparent",
        borderLeft: collapsed
          ? "none"
          : activa
            ? "2px solid #F97316"
            : "2px solid transparent",
        borderRight: collapsed && activa ? "2px solid #F97316" : "none",
      }}
    >
      {collapsed ? (
        <span style={{ fontSize: "15px", lineHeight: 1 }}>{icon}</span>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
