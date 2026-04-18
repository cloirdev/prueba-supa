import { useState, useEffect, useRef } from "react";

const POSICIONES = ["Base", "Escolta", "Alero", "Ala-Pívot", "Pívot"];

export default function AdminJugadores({ supabase, perfil }) {
  const [jugadores, setJugadores] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [temporadas, setTemporadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroPosicion, setFiltroPosicion] = useState("");
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [panelVista, setPanelVista] = useState("historial");
  const [formEditar, setFormEditar] = useState({});
  const [formAsignar, setFormAsignar] = useState({
    equipo_id: "",
    temporada_id: "",
    dorsal: "",
  });
  const [formNuevo, setFormNuevo] = useState({
    nombre: "",
    apellido: "",
    posicion: "",
  });
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [vistaCards, setVistaCards] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    cargarTodo();
  }, []);
  useEffect(() => {
    if (jugadorSeleccionado) cargarHistorial(jugadorSeleccionado.id);
  }, [jugadorSeleccionado]);

  async function cargarTodo() {
    const [{ data: jugs }, { data: eqs }, { data: temps }] = await Promise.all([
      supabase
        .from("jugadores")
        .select("id, nombre, apellido, posicion")
        .order("apellido"),
      supabase
        .from("equipos")
        .select(`id, sponsor, categorias (nombre), temporadas (nombre)`),
      supabase
        .from("temporadas")
        .select("id, nombre")
        .order("nombre", { ascending: false }),
    ]);
    setJugadores(jugs ?? []);
    setEquipos(eqs ?? []);
    setTemporadas(temps ?? []);
    setCargando(false);
  }

  async function cargarHistorial(jugadorId) {
    setCargandoHistorial(true);
    const { data } = await supabase
      .from("convocatorias_temporada")
      .select(
        `dorsal, equipos (id, sponsor, categorias (nombre)), temporadas (id, nombre)`,
      )
      .eq("jugador_id", jugadorId)
      .order("temporada_id", { ascending: false });
    setHistorial(data ?? []);
    setCargandoHistorial(false);
  }

  async function guardarEdicion() {
    setError("");
    setMsg("");
    const { error: err } = await supabase
      .from("jugadores")
      .update({
        nombre: formEditar.nombre,
        apellido: formEditar.apellido,
        posicion: formEditar.posicion || null,
      })
      .eq("id", jugadorSeleccionado.id);
    if (err) {
      setError("Error al guardar cambios");
      return;
    }
    setMsg("Cambios guardados correctamente");
    setJugadorSeleccionado({ ...jugadorSeleccionado, ...formEditar });
    setJugadores(
      jugadores.map((j) =>
        j.id === jugadorSeleccionado.id ? { ...j, ...formEditar } : j,
      ),
    );
  }

  async function asignarTemporada() {
    setError("");
    setMsg("");
    if (
      !formAsignar.equipo_id ||
      !formAsignar.temporada_id ||
      !formAsignar.dorsal
    ) {
      setError("Rellena todos los campos");
      return;
    }
    const { error: err } = await supabase
      .from("convocatorias_temporada")
      .insert({
        jugador_id: jugadorSeleccionado.id,
        equipo_id: formAsignar.equipo_id,
        temporada_id: formAsignar.temporada_id,
        dorsal: parseInt(formAsignar.dorsal),
      });
    if (err) {
      setError("Ya existe esta asignación o hay un error");
      return;
    }
    setMsg("Asignación añadida correctamente");
    setFormAsignar({ equipo_id: "", temporada_id: "", dorsal: "" });
    cargarHistorial(jugadorSeleccionado.id);
  }

  async function eliminarAsignacion(equipo_id, temporada_id) {
    if (!confirm("¿Quitar esta asignación?")) return;
    await supabase
      .from("convocatorias_temporada")
      .delete()
      .eq("jugador_id", jugadorSeleccionado.id)
      .eq("equipo_id", equipo_id)
      .eq("temporada_id", temporada_id);
    cargarHistorial(jugadorSeleccionado.id);
  }

  async function eliminarJugador() {
    if (
      !confirm(
        `¿Eliminar definitivamente a ${jugadorSeleccionado.nombre} ${jugadorSeleccionado.apellido}? Esta acción no se puede deshacer.`,
      )
    )
      return;
    await supabase.from("jugadores").delete().eq("id", jugadorSeleccionado.id);
    setJugadores(jugadores.filter((j) => j.id !== jugadorSeleccionado.id));
    setJugadorSeleccionado(null);
  }

  async function crearJugador() {
    setError("");
    setMsg("");
    if (!formNuevo.nombre || !formNuevo.apellido) {
      setError("Nombre y apellido son obligatorios");
      return;
    }
    const { error: err } = await supabase.from("jugadores").insert({
      nombre: formNuevo.nombre,
      apellido: formNuevo.apellido,
      posicion: formNuevo.posicion || null,
    });
    if (err) {
      setError("Error al crear jugador");
      return;
    }
    setMsg("Jugador creado correctamente");
    setFormNuevo({ nombre: "", apellido: "", posicion: "" });
    setMostrarFormNuevo(false);
    cargarTodo();
  }

  const jugadoresFiltrados = jugadores.filter((j) => {
    const texto = `${j.nombre} ${j.apellido}`.toLowerCase();
    const okBusqueda = texto.includes(busqueda.toLowerCase());
    const okPosicion = !filtroPosicion || j.posicion === filtroPosicion;
    return okBusqueda && okPosicion;
  });

  function abrirJugador(j) {
    setJugadorSeleccionado(j);
    setFormEditar({
      nombre: j.nombre,
      apellido: j.apellido,
      posicion: j.posicion ?? "",
    });
    setPanelVista("historial");
    setMsg("");
    setError("");
  }

  const iniciales = (j) =>
    `${j.nombre?.[0] ?? ""}${j.apellido?.[0] ?? ""}`.toUpperCase();
  const equipoLabel = (eq) => eq.sponsor ?? eq.categorias?.nombre ?? "Equipo";

  if (cargando)
    return <p style={{ color: "var(--muted)" }}>Cargando jugadores...</p>;

  return (
    <div
      style={{
        display: "flex",
        gap: "24px",
        height: "calc(100vh - 100px)",
        overflow: "hidden",
      }}
    >
      {/* Panel izquierdo: lista */}
      <div
        style={{
          width: jugadorSeleccionado ? "360px" : "100%",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          transition: "width .2s",
        }}
      >
        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1 style={{ marginBottom: "2px" }}>Jugadores</h1>
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>
              {jugadoresFiltrados.length} jugador
              {jugadoresFiltrados.length !== 1 ? "es" : ""} encontrado
              {jugadoresFiltrados.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => {
              setMostrarFormNuevo(!mostrarFormNuevo);
              setMsg("");
              setError("");
            }}
            style={mostrarFormNuevo ? btnSecondaryStyle : btnPrimaryStyle}
          >
            {mostrarFormNuevo ? "Cancelar" : "+ Nuevo jugador"}
          </button>
        </div>
        {mostrarFormNuevo && (
          <div
            className="card"
            style={{
              marginBottom: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              maxWidth: "420px",
            }}
          >
            {msg && (
              <p
                style={{
                  color: "#16a34a",
                  fontSize: "13px",
                  padding: "10px 14px",
                  background: "#f0fdf4",
                  borderRadius: "8px",
                  border: "1px solid #bbf7d0",
                  margin: 0,
                }}
              >
                {msg}
              </p>
            )}
            {error && (
              <p
                style={{
                  color: "#dc2626",
                  fontSize: "13px",
                  padding: "10px 14px",
                  background: "#fef2f2",
                  borderRadius: "8px",
                  border: "1px solid #fecaca",
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}
            <div>
              <label style={labelStyle}>Nombre</label>
              <input
                type="text"
                value={formNuevo.nombre}
                onChange={(e) =>
                  setFormNuevo({ ...formNuevo, nombre: e.target.value })
                }
                placeholder="Carlos"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Apellido</label>
              <input
                type="text"
                value={formNuevo.apellido}
                onChange={(e) =>
                  setFormNuevo({ ...formNuevo, apellido: e.target.value })
                }
                placeholder="García"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Posición</label>
              <select
                value={formNuevo.posicion}
                onChange={(e) =>
                  setFormNuevo({ ...formNuevo, posicion: e.target.value })
                }
                style={inputStyle}
              >
                <option value="">Sin posición</option>
                {POSICIONES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={crearJugador} style={btnPrimaryStyle}>
              Crear jugador
            </button>
          </div>
        )}

        {/* Buscador */}
        <div style={{ position: "relative", marginBottom: "10px" }}>
          <span
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--muted)",
              fontSize: "14px",
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar jugador..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px 10px 36px",
              borderRadius: "10px",
              border: "1px solid var(--borde)",
              background: "var(--card)",
              color: "var(--texto)",
              fontSize: "13px",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--muted)",
                fontSize: "16px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Toggle vista */}
        <div style={{ marginBottom: "16px" }}>
          <div
            onClick={() => setVistaCards(!vistaCards)}
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--card)",
              border: "1px solid var(--borde)",
              borderRadius: "12px",
              padding: "4px",
              width: "fit-content",
              cursor: "pointer",
              position: "relative",
              userSelect: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "4px",
                left: vistaCards ? "calc(50%)" : "4px",
                width: "calc(50% - 4px)",
                height: "calc(100% - 8px)",
                background: "var(--naranja)",
                borderRadius: "8px",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                zIndex: 0,
              }}
            />
            <div
              style={{
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                zIndex: 1,
                color: !vistaCards ? "white" : "var(--muted)",
                fontSize: "14px",
                fontWeight: 700,
                transition: "color 0.2s",
              }}
            >
              ☰
            </div>
            <div
              style={{
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                zIndex: 1,
                color: vistaCards ? "white" : "var(--muted)",
                fontSize: "14px",
                fontWeight: 700,
                transition: "color 0.2s",
              }}
            >
              ⊞
            </div>
          </div>
        </div>

        {/* Filtro posición */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: "uppercase",
              display: "block",
              marginBottom: "6px",
            }}
          >
            Filtrar por posición
          </label>
          <select
            value={filtroPosicion}
            onChange={(e) => setFiltroPosicion(e.target.value)}
            style={{
              ...inputStyle,
              cursor: "pointer",
              background: filtroPosicion
                ? "rgba(249,115,22,0.05)"
                : "var(--card)",
              borderColor: filtroPosicion ? "var(--naranja)" : "var(--borde)",
            }}
          >
            <option value="">Todas las posiciones</option>
            {POSICIONES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Lista jugadores */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: vistaCards ? "row" : "column",
            flexWrap: vistaCards ? "wrap" : "nowrap",
            gap: "10px",
            paddingRight: "4px",
            alignContent: "flex-start",
          }}
        >
          {jugadoresFiltrados.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>
              No hay jugadores que coincidan.
            </p>
          )}
          {jugadoresFiltrados.map((j) => {
            const seleccionado = jugadorSeleccionado?.id === j.id;
            return (
              <div
                key={j.id}
                onClick={() => abrirJugador(j)}
                style={{
                  display: "flex",
                  flexDirection: vistaCards ? "column" : "row",
                  alignItems: "center",
                  gap: vistaCards ? "8px" : "12px",
                  padding: vistaCards ? "16px 8px" : "10px 14px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  width: vistaCards
                    ? jugadorSeleccionado
                      ? "calc(50% - 10px)"
                      : "calc(10% - 10px)"
                    : "100%",
                  minWidth: vistaCards ? "120px" : "0",
                  border: seleccionado
                    ? "1.5px solid var(--naranja)"
                    : "1px solid var(--borde)",
                  background: seleccionado
                    ? "rgba(249,115,22,0.06)"
                    : "var(--card)",
                  transition: "all .2s ease",
                  boxSizing: "border-box",
                  textAlign: vistaCards ? "center" : "left",
                }}
              >
                <div
                  style={{
                    width: vistaCards ? "44px" : "38px",
                    height: vistaCards ? "44px" : "38px",
                    borderRadius: "50%",
                    background: seleccionado
                      ? "#F97316"
                      : "var(--azul-oscuro, #0f172a)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: vistaCards ? "14px" : "12px",
                    fontWeight: 800,
                    color: "white",
                    flexShrink: 0,
                  }}
                >
                  {iniciales(j)}
                </div>
                <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: vistaCards ? "12px" : "13px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      color: seleccionado ? "var(--naranja)" : "var(--texto)",
                    }}
                  >
                    {vistaCards ? j.nombre : `${j.apellido}, ${j.nombre}`}
                    {vistaCards && (
                      <div
                        style={{ overflow: "hidden", textOverflow: "ellipsis" }}
                      >
                        {j.apellido}
                      </div>
                    )}
                  </div>
                </div>
                {j.posicion && (
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: "6px",
                      background: "var(--fondo)",
                      color: "var(--muted)",
                      flexShrink: 0,
                      textTransform: "uppercase",
                      marginTop: vistaCards ? "4px" : "0",
                      border: "1px solid var(--borde)",
                    }}
                  >
                    {j.posicion}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel derecho: detalle */}
      {jugadorSeleccionado && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            borderLeft: "1px solid var(--borde)",
            paddingLeft: "24px",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#F97316",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: 900,
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {iniciales(jugadorSeleccionado)}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px" }}>
                  {jugadorSeleccionado.nombre} {jugadorSeleccionado.apellido}
                </h2>
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--muted)",
                    marginTop: "2px",
                  }}
                >
                  {jugadorSeleccionado.posicion ?? "Sin posición"} ·{" "}
                  {historial.length} temporada
                  {historial.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <button
              onClick={() => setJugadorSeleccionado(null)}
              style={{
                background: "none",
                border: "none",
                color: "var(--muted)",
                cursor: "pointer",
                fontSize: "20px",
                lineHeight: 1,
                padding: "4px",
              }}
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginBottom: "20px",
              borderBottom: "1px solid var(--borde)",
            }}
          >
            {[
              ["historial", "Historial"],
              ["editar", "Editar datos"],
              ["asignar", "Asignar equipo"],
            ].map(([v, label]) => (
              <button
                key={v}
                onClick={() => {
                  setPanelVista(v);
                  setMsg("");
                  setError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: panelVista === v ? "#F97316" : "var(--muted)",
                  borderBottom:
                    panelVista === v
                      ? "2px solid #F97316"
                      : "2px solid transparent",
                  marginBottom: "-1px",
                  transition: "all .15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {msg && (
            <p
              style={{
                color: "#16a34a",
                fontSize: "13px",
                marginBottom: "14px",
                padding: "10px 14px",
                background: "#f0fdf4",
                borderRadius: "8px",
                border: "1px solid #bbf7d0",
              }}
            >
              {msg}
            </p>
          )}
          {error && (
            <p
              style={{
                color: "#dc2626",
                fontSize: "13px",
                marginBottom: "14px",
                padding: "10px 14px",
                background: "#fef2f2",
                borderRadius: "8px",
                border: "1px solid #fecaca",
              }}
            >
              {error}
            </p>
          )}

          {/* Tab Historial */}
          {panelVista === "historial" && (
            <div>
              {cargandoHistorial ? (
                <p style={{ color: "var(--muted)", fontSize: "13px" }}>
                  Cargando historial...
                </p>
              ) : historial.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "13px" }}>
                  Este jugador no tiene temporadas registradas aún.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {historial.map((h, i) => (
                    <div
                      key={i}
                      className="card"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                        }}
                      >
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "var(--azul-oscuro, #0f172a)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "13px",
                            fontWeight: 800,
                            color: "#F97316",
                          }}
                        >
                          {h.dorsal}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "13px" }}>
                            {h.equipos?.sponsor ??
                              h.equipos?.categorias?.nombre ??
                              "—"}
                          </div>
                          <div
                            style={{ fontSize: "11px", color: "var(--muted)" }}
                          >
                            {h.temporadas?.nombre ?? "—"} · #{h.dorsal}
                          </div>
                        </div>
                      </div>
                      {perfil?.rol === "admin" && (
                        <button
                          onClick={() =>
                            eliminarAsignacion(h.equipos?.id, h.temporadas?.id)
                          }
                          style={{
                            background: "transparent",
                            border: "1px solid var(--borde)",
                            color: "var(--muted)",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "11px",
                          }}
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Editar */}
          {panelVista === "editar" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                maxWidth: "420px",
              }}
            >
              {[
                { key: "nombre", label: "Nombre", placeholder: "Carlos" },
                { key: "apellido", label: "Apellido", placeholder: "García" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    type="text"
                    value={formEditar[key] ?? ""}
                    onChange={(e) =>
                      setFormEditar({ ...formEditar, [key]: e.target.value })
                    }
                    placeholder={placeholder}
                    style={inputStyle}
                  />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Posición</label>
                <select
                  value={formEditar.posicion ?? ""}
                  onChange={(e) =>
                    setFormEditar({ ...formEditar, posicion: e.target.value })
                  }
                  style={inputStyle}
                >
                  <option value="">Sin posición</option>
                  {POSICIONES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button onClick={guardarEdicion} style={btnPrimaryStyle}>
                  Guardar cambios
                </button>
                {perfil?.rol === "admin" && (
                  <button
                    onClick={eliminarJugador}
                    style={{
                      ...btnSecondaryStyle,
                      color: "#dc2626",
                      borderColor: "#fecaca",
                    }}
                  >
                    Eliminar jugador
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tab Asignar */}
          {panelVista === "asignar" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                maxWidth: "420px",
              }}
            >
              <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
                Vincula a este jugador con un equipo y temporada específicos.
              </p>
              <div>
                <label style={labelStyle}>Equipo</label>
                <select
                  value={formAsignar.equipo_id}
                  onChange={(e) =>
                    setFormAsignar({
                      ...formAsignar,
                      equipo_id: e.target.value,
                    })
                  }
                  style={inputStyle}
                >
                  <option value="">Selecciona equipo</option>
                  {equipos.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {equipoLabel(eq)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Temporada</label>
                <select
                  value={formAsignar.temporada_id}
                  onChange={(e) =>
                    setFormAsignar({
                      ...formAsignar,
                      temporada_id: e.target.value,
                    })
                  }
                  style={inputStyle}
                >
                  <option value="">Selecciona temporada</option>
                  {temporadas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Dorsal</label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={formAsignar.dorsal}
                  onChange={(e) =>
                    setFormAsignar({ ...formAsignar, dorsal: e.target.value })
                  }
                  style={{ ...inputStyle, width: "80px" }}
                />
              </div>
              <button onClick={asignarTemporada} style={btnPrimaryStyle}>
                Asignar
              </button>
              {historial.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                      marginBottom: "8px",
                    }}
                  >
                    Asignaciones actuales
                  </div>
                  {historial.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: "12px",
                        color: "var(--muted)",
                        padding: "5px 0",
                        borderBottom: "1px solid var(--borde)",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "var(--texto)" }}>
                        {h.temporadas?.nombre}
                      </span>{" "}
                      ·{" "}
                      {h.equipos?.sponsor ??
                        h.equipos?.categorias?.nombre ??
                        "—"}{" "}
                      · #{h.dorsal}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Panel derecho: crear jugador (cuando no hay seleccionado) */}
      {!jugadorSeleccionado && (
        <div
          style={{
            width: "320px",
            flexShrink: 0,
            borderLeft: "1px solid var(--borde)",
            paddingLeft: "24px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h2 style={{ fontSize: "16px", marginBottom: "4px" }}>
            Nuevo jugador
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "var(--muted)",
              marginBottom: "20px",
            }}
          >
            Añade un jugador a la base de datos.
          </p>

          {msg && (
            <p
              style={{
                color: "#16a34a",
                fontSize: "13px",
                marginBottom: "14px",
                padding: "10px 14px",
                background: "#f0fdf4",
                borderRadius: "8px",
                border: "1px solid #bbf7d0",
              }}
            >
              {msg}
            </p>
          )}
          {error && (
            <p
              style={{
                color: "#dc2626",
                fontSize: "13px",
                marginBottom: "14px",
                padding: "10px 14px",
                background: "#fef2f2",
                borderRadius: "8px",
                border: "1px solid #fecaca",
              }}
            >
              {error}
            </p>
          )}

          <div
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <div>
              <label style={labelStyle}>Nombre</label>
              <input
                type="text"
                value={formNuevo.nombre}
                onChange={(e) =>
                  setFormNuevo({ ...formNuevo, nombre: e.target.value })
                }
                placeholder="Carlos"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Apellido</label>
              <input
                type="text"
                value={formNuevo.apellido}
                onChange={(e) =>
                  setFormNuevo({ ...formNuevo, apellido: e.target.value })
                }
                placeholder="García"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Posición</label>
              <select
                value={formNuevo.posicion}
                onChange={(e) =>
                  setFormNuevo({ ...formNuevo, posicion: e.target.value })
                }
                style={inputStyle}
              >
                <option value="">Sin posición</option>
                {POSICIONES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={crearJugador} style={btnPrimaryStyle}>
              Crear jugador
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  fontSize: "12px",
  fontWeight: 700,
  display: "block",
  marginBottom: "5px",
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: ".05em",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid var(--borde)",
  background: "var(--fondo)",
  color: "var(--texto)",
  fontSize: "13px",
  boxSizing: "border-box",
};

const btnPrimaryStyle = {
  background: "var(--naranja)",
  color: "white",
  border: "none",
  padding: "11px 20px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const btnSecondaryStyle = {
  background: "transparent",
  color: "var(--muted)",
  border: "1px solid var(--borde)",
  padding: "11px 16px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};
