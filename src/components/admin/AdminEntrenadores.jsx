import { useState, useEffect, useRef } from "react";

const ROLES_ENTRENADOR = [
  { val: "principal", label: "Principal" },
  { val: "ayudante", label: "Ayudante" },
];

export default function AdminEntrenadores({ supabase, perfil }) {
  const [entrenadores, setEntrenadores] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [jugadores, setJugadores] = useState([]); // fix 2: estado añadido
  const [temporadas, setTemporadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [entrenadorSeleccionado, setEntrenadorSeleccionado] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [panelVista, setPanelVista] = useState("historial");
  const [formEditar, setFormEditar] = useState({});
  const [formAsignar, setFormAsignar] = useState({
    equipo_id: "",
    temporada_id: "",
    rol: "principal",
  });
  const [formNuevo, setFormNuevo] = useState({
    nombre: "",
    apellido: "",
    jugador_id: "", // fix 4: incluido desde el inicio
  });
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    cargarTodo();
  }, []);
  useEffect(() => {
    if (entrenadorSeleccionado) cargarHistorial(entrenadorSeleccionado.id);
  }, [entrenadorSeleccionado]);

  // fix 1: desestructura los 4 elementos y usa jugs correctamente
  async function cargarTodo() {
    const [{ data: ents }, { data: eqs }, { data: temps }, { data: jugs }] =
      await Promise.all([
        supabase
          .from("entrenadores")
          .select("id, nombre, apellido, jugador_id")
          .order("apellido"),
        supabase
          .from("equipos")
          .select(`id, sponsor, categorias (nombre), temporadas (id, nombre)`),
        supabase
          .from("temporadas")
          .select("id, nombre")
          .order("nombre", { ascending: false }),
        supabase
          .from("jugadores")
          .select("id, nombre, apellido")
          .order("apellido"),
      ]);
    setEntrenadores(ents ?? []);
    setEquipos(eqs ?? []);
    setTemporadas(temps ?? []);
    setJugadores(jugs ?? []); // fix 1: ahora sí existe el estado
    setCargando(false);
  }

  async function cargarHistorial(entrenadorId) {
    setCargandoHistorial(true);
    const { data } = await supabase
      .from("convocatorias_entrenador")
      .select(
        `rol, equipos (id, sponsor, categorias (nombre)), temporadas (id, nombre)`,
      )
      .eq("entrenador_id", entrenadorId)
      .order("temporada_id", { ascending: false });
    setHistorial(data ?? []);
    setCargandoHistorial(false);
  }

  async function crearEntrenador() {
    setError("");
    setMsg("");
    if (!formNuevo.nombre || !formNuevo.apellido) {
      setError("Nombre y apellido son obligatorios");
      return;
    }
    // fix 3: incluye jugador_id en el insert
    const { error: err } = await supabase.from("entrenadores").insert({
      nombre: formNuevo.nombre,
      apellido: formNuevo.apellido,
      jugador_id: formNuevo.jugador_id || null,
    });
    if (err) {
      setError("Error al crear entrenador");
      return;
    }
    setMsg("Entrenador creado correctamente");
    setFormNuevo({ nombre: "", apellido: "", jugador_id: "" }); // fix 4: reset completo
    cargarTodo();
  }

  async function guardarEdicion() {
    setError("");
    setMsg("");
    const { error: err } = await supabase
      .from("entrenadores")
      .update({ nombre: formEditar.nombre, apellido: formEditar.apellido })
      .eq("id", entrenadorSeleccionado.id);
    if (err) {
      setError("Error al guardar cambios");
      return;
    }
    setMsg("Cambios guardados correctamente");
    setEntrenadorSeleccionado({ ...entrenadorSeleccionado, ...formEditar });
    setEntrenadores(
      entrenadores.map((e) =>
        e.id === entrenadorSeleccionado.id ? { ...e, ...formEditar } : e,
      ),
    );
  }

  async function asignarTemporada() {
    setError("");
    setMsg("");
    if (!formAsignar.equipo_id || !formAsignar.temporada_id) {
      setError("Rellena todos los campos");
      return;
    }
    const existente = historial.find(
      (h) =>
        h.equipos?.id === formAsignar.equipo_id &&
        h.temporadas?.id === formAsignar.temporada_id &&
        h.rol === formAsignar.rol,
    );
    if (existente) {
      await supabase
        .from("convocatorias_entrenador")
        .delete()
        .eq("entrenador_id", entrenadorSeleccionado.id)
        .eq("equipo_id", formAsignar.equipo_id)
        .eq("temporada_id", formAsignar.temporada_id);
    }
    const { error: err } = await supabase
      .from("convocatorias_entrenador")
      .insert({
        entrenador_id: entrenadorSeleccionado.id,
        equipo_id: formAsignar.equipo_id,
        temporada_id: formAsignar.temporada_id,
        rol: formAsignar.rol,
      });
    if (err) {
      setError("Ya existe esta asignación o hay un error");
      return;
    }
    setMsg("Asignación añadida correctamente");
    setFormAsignar({ equipo_id: "", temporada_id: "", rol: "principal" });
    cargarHistorial(entrenadorSeleccionado.id);
  }

  async function eliminarAsignacion(equipo_id, temporada_id) {
    if (!confirm("¿Quitar esta asignación?")) return;
    await supabase
      .from("convocatorias_entrenador")
      .delete()
      .eq("entrenador_id", entrenadorSeleccionado.id)
      .eq("equipo_id", equipo_id)
      .eq("temporada_id", temporada_id);
    cargarHistorial(entrenadorSeleccionado.id);
  }

  async function eliminarEntrenador() {
    if (
      !confirm(
        `¿Eliminar definitivamente a ${entrenadorSeleccionado.nombre} ${entrenadorSeleccionado.apellido}? Esta acción no se puede deshacer.`,
      )
    )
      return;
    await supabase
      .from("entrenadores")
      .delete()
      .eq("id", entrenadorSeleccionado.id);
    setEntrenadores(
      entrenadores.filter((e) => e.id !== entrenadorSeleccionado.id),
    );
    setEntrenadorSeleccionado(null);
  }

  const entrenadoresFiltrados = entrenadores.filter((e) => {
    const texto = `${e.nombre} ${e.apellido}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  function abrirEntrenador(e) {
    setEntrenadorSeleccionado(e);
    setFormEditar({ nombre: e.nombre, apellido: e.apellido });
    setPanelVista("historial");
    setMsg("");
    setError("");
  }

  const iniciales = (e) =>
    `${e.nombre?.[0] ?? ""}${e.apellido?.[0] ?? ""}`.toUpperCase();

  const equipoLabel = (eq) => {
    const partes = [
      eq.sponsor,
      eq.categorias?.nombre,
      eq.temporadas?.nombre,
    ].filter(Boolean);
    return partes.join(" · ");
  };

  if (cargando)
    return <p style={{ color: "var(--muted)" }}>Cargando entrenadores...</p>;

  return (
    <div
      style={{
        display: "flex",
        gap: "24px",
        height: "calc(100vh - 100px)",
        overflow: "hidden",
      }}
    >
      {/* ── Panel izquierdo ── */}
      <div
        style={{
          width: entrenadorSeleccionado ? "360px" : "100%",
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
            <h1 style={{ marginBottom: "2px" }}>Entrenadores</h1>
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>
              {entrenadoresFiltrados.length} entrenador
              {entrenadoresFiltrados.length !== 1 ? "es" : ""} encontrado
              {entrenadoresFiltrados.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Buscador */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
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
            placeholder="Buscar entrenador..."
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
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Botón nuevo entrenador */}
        <button
          onClick={() => {
            setMostrarFormNuevo(!mostrarFormNuevo);
            setEntrenadorSeleccionado(null);
            setMsg("");
            setError("");
          }}
          style={{
            ...(mostrarFormNuevo ? btnSecondaryStyle : btnPrimaryStyle),
            marginBottom: "16px",
            width: "100%",
          }}
        >
          {mostrarFormNuevo ? "Cancelar" : "+ Nuevo entrenador"}
        </button>

        {/* Formulario nuevo entrenador */}
        {mostrarFormNuevo && (
          <div
            className="card"
            style={{
              marginBottom: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
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

            {[
              { key: "nombre", label: "Nombre", placeholder: "Carlos" },
              { key: "apellido", label: "Apellido", placeholder: "García" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input
                  type="text"
                  value={formNuevo[key]}
                  onChange={(e) =>
                    setFormNuevo({ ...formNuevo, [key]: e.target.value })
                  }
                  placeholder={placeholder}
                  style={inputStyle}
                />
              </div>
            ))}
            {/* fix 5: select de exjugador ANTES que nombre/apellido para autorellenar */}
            <div>
              <label style={labelStyle}>
                Exjugador vinculado{" "}
                <span
                  style={{
                    color: "var(--muted)",
                    fontWeight: 400,
                    textTransform: "none",
                  }}
                >
                  (opcional)
                </span>
              </label>
              <select
                value={formNuevo.jugador_id}
                onChange={(e) => {
                  const jugador = jugadores.find(
                    (j) => j.id === e.target.value,
                  );
                  setFormNuevo({
                    ...formNuevo,
                    jugador_id: e.target.value,
                    nombre: jugador?.nombre ?? formNuevo.nombre,
                    apellido: jugador?.apellido ?? formNuevo.apellido,
                  });
                }}
                style={inputStyle}
              >
                <option value="">Ninguno</option>
                {jugadores.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.apellido}, {j.nombre}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={async () => {
                await crearEntrenador();
                if (!error) setMostrarFormNuevo(false);
              }}
              style={btnPrimaryStyle}
            >
              Crear entrenador
            </button>
          </div>
        )}

        {/* Lista de entrenadores */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            paddingRight: "4px",
          }}
        >
          {entrenadoresFiltrados.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>
              No hay entrenadores que coincidan.
            </p>
          )}
          {entrenadoresFiltrados.map((e) => {
            const sel = entrenadorSeleccionado?.id === e.id;
            return (
              <div
                key={e.id}
                onClick={() => abrirEntrenador(e)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  width: "100%",
                  border: sel
                    ? "1.5px solid var(--naranja)"
                    : "1px solid var(--borde)",
                  background: sel ? "rgba(249,115,22,0.06)" : "var(--card)",
                  transition: "all .2s ease",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: sel ? "#F97316" : "var(--azul-oscuro, #0f172a)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 800,
                    color: "white",
                    flexShrink: 0,
                  }}
                >
                  {iniciales(e)}
                </div>

                {/* fix 6: badge "Exjugador" en la lista */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "13px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      color: sel ? "var(--naranja)" : "var(--texto)",
                    }}
                  >
                    {e.apellido}, {e.nombre}
                  </div>
                  {e.jugador_id && (
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 800,
                        padding: "1px 6px",
                        borderRadius: "6px",
                        background: "#fef3c7",
                        color: "#92400e",
                        border: "1px solid #fde68a",
                        display: "inline-block",
                        marginTop: "2px",
                      }}
                    >
                      Exjugador
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Panel derecho: detalle ── */}
      {entrenadorSeleccionado && (
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
                {iniciales(entrenadorSeleccionado)}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px" }}>
                  {entrenadorSeleccionado.nombre}{" "}
                  {entrenadorSeleccionado.apellido}
                </h2>
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--muted)",
                    marginTop: "2px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {historial.length} temporada
                  {historial.length !== 1 ? "s" : ""}
                  {entrenadorSeleccionado.jugador_id && (
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 800,
                        padding: "1px 6px",
                        borderRadius: "6px",
                        background: "#fef3c7",
                        color: "#92400e",
                        border: "1px solid #fde68a",
                      }}
                    >
                      Exjugador
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setEntrenadorSeleccionado(null)}
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
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {cargandoHistorial ? (
                <p style={{ color: "var(--muted)", fontSize: "13px" }}>
                  Cargando historial...
                </p>
              ) : historial.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "13px" }}>
                  Este entrenador no tiene temporadas registradas aún.
                </p>
              ) : (
                historial.map((h, i) => (
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
                          fontSize: "16px",
                        }}
                      >
                        🎽
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
                          {h.temporadas?.nombre ?? "—"} ·{" "}
                          {ROLES_ENTRENADOR.find((r) => r.val === h.rol)
                            ?.label ?? h.rol}
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
                ))
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
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button onClick={guardarEdicion} style={btnPrimaryStyle}>
                  Guardar cambios
                </button>
                {perfil?.rol === "admin" && (
                  <button
                    onClick={eliminarEntrenador}
                    style={{
                      ...btnSecondaryStyle,
                      color: "#dc2626",
                      borderColor: "#fecaca",
                    }}
                  >
                    Eliminar entrenador
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
                Vincula a este entrenador con un equipo y temporada específicos.
              </p>
              <div>
                <label style={labelStyle}>Rol</label>
                <select
                  value={formAsignar.rol}
                  onChange={(e) =>
                    setFormAsignar({ ...formAsignar, rol: e.target.value })
                  }
                  style={{ ...inputStyle, width: "auto" }}
                >
                  {ROLES_ENTRENADOR.map(({ val, label }) => (
                    <option key={val} value={val}>
                      {label}
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
                      equipo_id: "",
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
                  disabled={!formAsignar.temporada_id}
                >
                  <option value="">
                    {formAsignar.temporada_id
                      ? "Selecciona equipo"
                      : "Primero selecciona una temporada"}
                  </option>
                  {equipos
                    .filter(
                      (eq) =>
                        !formAsignar.temporada_id ||
                        eq.temporadas?.id === formAsignar.temporada_id,
                    )
                    .map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {equipoLabel(eq)}
                      </option>
                    ))}
                </select>
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
                      </span>
                      {" · "}
                      {h.equipos?.sponsor ??
                        h.equipos?.categorias?.nombre ??
                        "—"}
                      {" · "}
                      {ROLES_ENTRENADOR.find((r) => r.val === h.rol)?.label ??
                        h.rol}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
