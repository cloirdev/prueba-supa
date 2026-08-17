import { useState, useEffect } from "react";

const POSICIONES = ["Base", "Escolta", "Alero", "Ala-Pívot", "Pívot"];
const ROLES_ENTRENADOR = [
  { val: "principal", label: "Entrenador principal" },
  { val: "ayudante", label: "Ayudante" },
];

const normalizarGenero = (g) => (g ?? "").toString().trim().toLowerCase();

function esCompatibleConEquipo(jugador, equipo) {
  const generoEquipo = normalizarGenero(equipo?.categorias?.genero);
  const generoJugador = normalizarGenero(jugador?.genero);
  if (!generoEquipo || generoEquipo === "mixto") return true;
  if (!generoJugador) return true;
  return generoEquipo === generoJugador;
}

export default function AdminPlantilla({
  supabase,
  perfil,
  equipo,
  temporada,
  onBack,
}) {
  const [jugadores, setJugadores] = useState([]);
  const [todosJugadores, setTodosJugadores] = useState([]);
  const [entrenadores, setEntrenadores] = useState([]); // cuerpo técnico del equipo
  const [todosEntrenadores, setTodosEntrenadores] = useState([]); // todos los entrenadores
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState("lista");
  const [form, setForm] = useState({ jugador_id: "", dorsal: "" });
  const [formEntrenador, setFormEntrenador] = useState({
    entrenador_id: "",
    rol: "principal",
  });
  const [nuevoJugador, setNuevoJugador] = useState({
    nombre: "",
    apellido: "",
    posicion: "",
  });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    const [
      { data: conv },
      { data: todos },
      { data: convEnt },
      { data: todosEnt },
    ] = await Promise.all([
      supabase
        .from("convocatorias_temporada")
        .select(`dorsal, jugadores (id, nombre, apellido, posicion, genero)`)
        .eq("equipo_id", equipo.id)
        .eq("temporada_id", temporada.id)
        .order("dorsal"),
      supabase
        .from("jugadores")
        .select("id, nombre, apellido, posicion, genero")
        .order("apellido"),
      supabase
        .from("convocatorias_entrenador")
        .select(`rol, entrenadores (id, nombre, apellido)`)
        .eq("equipo_id", equipo.id)
        .eq("temporada_id", temporada.id),
      supabase
        .from("entrenadores")
        .select("id, nombre, apellido")
        .order("apellido"),
    ]);
    setJugadores(conv ?? []);
    setTodosJugadores(todos ?? []);
    setEntrenadores(convEnt ?? []);
    setTodosEntrenadores(todosEnt ?? []);
    setCargando(false);
  }

  async function asignarJugador() {
    setError("");
    setMsg("");
    if (!form.jugador_id || !form.dorsal) {
      setError("Rellena todos los campos");
      return;
    }

    const jugadorSeleccionado = todosJugadores.find(
      (j) => j.id === form.jugador_id,
    );
    if (
      jugadorSeleccionado &&
      !esCompatibleConEquipo(jugadorSeleccionado, equipo)
    ) {
      setError(
        "Este jugador no es compatible con la categoría de género del equipo",
      );
      return;
    }

    const { error: err } = await supabase
      .from("convocatorias_temporada")
      .insert({
        jugador_id: form.jugador_id,
        equipo_id: equipo.id,
        temporada_id: temporada.id,
        dorsal: parseInt(form.dorsal),
      });
    if (err) {
      setError("Error al asignar jugador");
      return;
    }
    setMsg("Jugador asignado correctamente");
    setForm({ jugador_id: "", dorsal: "" });
    cargar();
  }

  async function eliminarJugador(jugador_id, nombre) {
    if (!confirm(`¿Quitar a ${nombre} de la plantilla?`)) return;
    await supabase
      .from("convocatorias_temporada")
      .delete()
      .eq("jugador_id", jugador_id)
      .eq("equipo_id", equipo.id)
      .eq("temporada_id", temporada.id);
    cargar();
  }

  async function crearJugador() {
    setError("");
    setMsg("");
    if (
      !nuevoJugador.nombre ||
      !nuevoJugador.apellido ||
      !nuevoJugador.posicion
    ) {
      setError("Rellena todos los campos");
      return;
    }
    const { error: err } = await supabase
      .from("jugadores")
      .insert(nuevoJugador);
    if (err) {
      setError("Error al crear jugador");
      return;
    }
    setMsg("Jugador creado correctamente");
    setNuevoJugador({ nombre: "", apellido: "", posicion: "" });
    cargar();
  }

  async function asignarEntrenador() {
    setError("");
    setMsg("");
    if (!formEntrenador.entrenador_id) {
      setError("Selecciona un entrenador");
      return;
    }

    // Si ya hay uno con ese rol, lo sustituimos
    const existente = entrenadores.find((e) => e.rol === formEntrenador.rol);
    if (existente) {
      await supabase
        .from("convocatorias_entrenador")
        .delete()
        .eq("entrenador_id", existente.entrenadores.id)
        .eq("equipo_id", equipo.id)
        .eq("temporada_id", temporada.id);
    }

    const { error: err } = await supabase
      .from("convocatorias_entrenador")
      .insert({
        entrenador_id: formEntrenador.entrenador_id,
        equipo_id: equipo.id,
        temporada_id: temporada.id,
        rol: formEntrenador.rol,
      });
    if (err) {
      setError("Error al asignar entrenador");
      return;
    }
    setMsg("Entrenador asignado correctamente");
    setFormEntrenador({ entrenador_id: "", rol: "principal" });
    cargar();
  }

  async function eliminarEntrenador(entrenador_id, nombre) {
    if (!confirm(`¿Quitar a ${nombre} del cuerpo técnico?`)) return;
    await supabase
      .from("convocatorias_entrenador")
      .delete()
      .eq("entrenador_id", entrenador_id)
      .eq("equipo_id", equipo.id)
      .eq("temporada_id", temporada.id);
    cargar();
  }

  if (cargando)
    return <p style={{ color: "var(--muted)" }}>Cargando plantilla...</p>;

  const tabs = [
    { val: "lista", label: "Jugadores" },
    { val: "cuerpo", label: "Cuerpo técnico" },
    { val: "asignar", label: "Asignar jugador" },
    { val: "entrenador", label: "Asignar entrenador" },
    { val: "nuevo", label: "Nuevo jugador" },
  ];

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

      <h1 style={{ marginBottom: "4px" }}>Plantilla</h1>
      <p
        style={{
          color: "var(--muted)",
          fontSize: "14px",
          marginBottom: "24px",
        }}
      >
        {equipo.sponsor ?? equipo.categorias?.nombre} · {temporada.nombre}
      </p>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          flexWrap: "wrap",
          width: "100%",
        }}
      >
        {tabs.map(({ val, label }, index) => (
          <button
            key={val}
            onClick={() => {
              setVista(val);
              setMsg("");
              setError("");
            }}
            style={{
              padding: "7px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              background: vista === val ? "var(--naranja)" : "transparent",
              color: vista === val ? "white" : "var(--muted)",
              border: vista === val ? "none" : "1px solid var(--borde)",
              marginLeft: index === 2 ? "auto" : "0",
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
            marginBottom: "16px",
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
            marginBottom: "16px",
            padding: "10px 14px",
            background: "#fef2f2",
            borderRadius: "8px",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </p>
      )}

      {/* Tab: Jugadores */}
      {vista === "lista" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {jugadores.length === 0 && (
            <p style={{ color: "var(--muted)" }}>
              No hay jugadores en esta plantilla.
            </p>
          )}
          {jugadores.map((c) => (
            <div
              key={c.jugadores.id}
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "var(--azul-oscuro)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: 800,
                    color: "var(--naranja)",
                    flexShrink: 0,
                  }}
                >
                  {c.dorsal}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px" }}>
                    {c.jugadores.nombre} {c.jugadores.apellido}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                    {c.jugadores.posicion}
                  </div>
                </div>
              </div>
              {perfil?.rol === "admin" && (
                <button
                  onClick={() =>
                    eliminarJugador(
                      c.jugadores.id,
                      `${c.jugadores.nombre} ${c.jugadores.apellido}`,
                    )
                  }
                  style={{
                    background: "transparent",
                    border: "1px solid var(--borde)",
                    color: "var(--muted)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Quitar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Cuerpo técnico */}
      {vista === "cuerpo" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {entrenadores.length === 0 && (
            <p style={{ color: "var(--muted)" }}>
              No hay cuerpo técnico asignado.
            </p>
          )}
          {entrenadores.map((c) => (
            <div
              key={c.entrenadores.id}
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "var(--azul-oscuro)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    flexShrink: 0,
                  }}
                >
                  🎽
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px" }}>
                    {c.entrenadores.nombre} {c.entrenadores.apellido}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                    {ROLES_ENTRENADOR.find((r) => r.val === c.rol)?.label ??
                      c.rol}
                  </div>
                </div>
              </div>
              {perfil?.rol === "admin" && (
                <button
                  onClick={() =>
                    eliminarEntrenador(
                      c.entrenadores.id,
                      `${c.entrenadores.nombre} ${c.entrenadores.apellido}`,
                    )
                  }
                  style={{
                    background: "transparent",
                    border: "1px solid var(--borde)",
                    color: "var(--muted)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Quitar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Asignar jugador */}
      {vista === "asignar" && (
        <div
          className="card"
          style={{
            maxWidth: "400px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div>
            <label
              style={{
                fontSize: "13px",
                fontWeight: 700,
                display: "block",
                marginBottom: "6px",
              }}
            >
              Jugador
            </label>
            <select
              value={form.jugador_id}
              onChange={(e) => setForm({ ...form, jugador_id: e.target.value })}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--borde)",
                background: "var(--fondo)",
                color: "var(--texto)",
                fontSize: "14px",
              }}
            >
              <option value="">Selecciona jugador</option>
              {todosJugadores
                .filter((j) => !jugadores.some((c) => c.jugadores.id === j.id))
                .filter((j) => esCompatibleConEquipo(j, equipo))
                .map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.apellido}, {j.nombre} — {j.posicion}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label
              style={{
                fontSize: "13px",
                fontWeight: 700,
                display: "block",
                marginBottom: "6px",
              }}
            >
              Dorsal
            </label>
            <input
              type="number"
              min="0"
              max="99"
              value={form.dorsal}
              onChange={(e) => setForm({ ...form, dorsal: e.target.value })}
              placeholder="7"
              style={{
                width: "80px",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--borde)",
                background: "var(--fondo)",
                color: "var(--texto)",
                fontSize: "14px",
              }}
            />
          </div>
          <button
            onClick={asignarJugador}
            style={{
              background: "var(--naranja)",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Asignar
          </button>
        </div>
      )}

      {/* Tab: Asignar entrenador */}
      {vista === "entrenador" && (
        <div
          className="card"
          style={{
            maxWidth: "400px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
            Si ya hay un entrenador con ese rol, será sustituido
            automáticamente.
          </p>
          <div>
            <label
              style={{
                fontSize: "13px",
                fontWeight: 700,
                display: "block",
                marginBottom: "6px",
              }}
            >
              Rol
            </label>
            <select
              value={formEntrenador.rol}
              onChange={(e) =>
                setFormEntrenador({ ...formEntrenador, rol: e.target.value })
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--borde)",
                background: "var(--fondo)",
                color: "var(--texto)",
                fontSize: "14px",
              }}
            >
              {ROLES_ENTRENADOR.map(({ val, label }) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                fontSize: "13px",
                fontWeight: 700,
                display: "block",
                marginBottom: "6px",
              }}
            >
              Entrenador
            </label>
            <select
              value={formEntrenador.entrenador_id}
              onChange={(e) =>
                setFormEntrenador({
                  ...formEntrenador,
                  entrenador_id: e.target.value,
                })
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--borde)",
                background: "var(--fondo)",
                color: "var(--texto)",
                fontSize: "14px",
              }}
            >
              <option value="">Selecciona entrenador</option>
              {todosEntrenadores.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.apellido}, {e.nombre}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={asignarEntrenador}
            style={{
              background: "var(--naranja)",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Asignar entrenador
          </button>
        </div>
      )}

      {/* Tab: Nuevo jugador */}
      {vista === "nuevo" && (
        <div
          className="card"
          style={{
            maxWidth: "400px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {[
            { key: "nombre", label: "Nombre", placeholder: "Carlos" },
            { key: "apellido", label: "Apellido", placeholder: "García" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                {label}
              </label>
              <input
                type="text"
                value={nuevoJugador[key]}
                onChange={(e) =>
                  setNuevoJugador({ ...nuevoJugador, [key]: e.target.value })
                }
                placeholder={placeholder}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--borde)",
                  background: "var(--fondo)",
                  color: "var(--texto)",
                  fontSize: "14px",
                }}
              />
            </div>
          ))}
          <div>
            <label
              style={{
                fontSize: "13px",
                fontWeight: 700,
                display: "block",
                marginBottom: "6px",
              }}
            >
              Posición
            </label>
            <select
              value={nuevoJugador.posicion}
              onChange={(e) =>
                setNuevoJugador({ ...nuevoJugador, posicion: e.target.value })
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--borde)",
                background: "var(--fondo)",
                color: "var(--texto)",
                fontSize: "14px",
              }}
            >
              <option value="">Selecciona posición</option>
              {POSICIONES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={crearJugador}
            style={{
              background: "var(--naranja)",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Crear jugador
          </button>
        </div>
      )}
    </div>
  );
}
