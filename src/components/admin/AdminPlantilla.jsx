import { useState, useEffect } from "react";

export default function AdminPlantilla({
  supabase,
  perfil,
  equipo,
  temporada,
  onBack,
}) {
  const [jugadores, setJugadores] = useState([]);
  const [todosJugadores, setTodosJugadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState("lista");
  const [form, setForm] = useState({ jugador_id: "", dorsal: "" });
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
    const [{ data: conv }, { data: todos }] = await Promise.all([
      supabase
        .from("convocatorias_temporada")
        .select(`dorsal, jugadores (id, nombre, apellido, posicion)`)
        .eq("equipo_id", equipo.id)
        .eq("temporada_id", temporada.temporadas.id)
        .order("dorsal"),
      supabase
        .from("jugadores")
        .select("id, nombre, apellido, posicion")
        .order("apellido"),
    ]);
    setJugadores(conv ?? []);
    setTodosJugadores(todos ?? []);
    setCargando(false);
  }

  async function crearJugador() {
    setError("");
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

  async function asignarJugador() {
    setError("");
    if (!form.jugador_id || !form.dorsal) {
      setError("Rellena todos los campos");
      return;
    }
    const { error: err } = await supabase
      .from("convocatorias_temporada")
      .insert({
        jugador_id: form.jugador_id,
        equipo_id: equipo.id,
        temporada_id: temporada.temporadas.id,
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
    if (!confirm(`¿Seguro que quieres quitar a ${nombre} de la plantilla?`))
      return;
    await supabase
      .from("convocatorias_temporada")
      .delete()
      .eq("jugador_id", jugador_id)
      .eq("equipo_id", equipo.id)
      .eq("temporada_id", temporada.temporadas.id);
    cargar();
  }

  if (cargando)
    return <p style={{ color: "var(--muted)" }}>Cargando plantilla...</p>;

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
        {equipo.nombre} · {temporada.temporadas.nombre}
      </p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {["lista", "asignar", "nuevo"].map((v) => (
          <button
            key={v}
            onClick={() => {
              setVista(v);
              setMsg("");
              setError("");
            }}
            style={{
              padding: "7px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              background: vista === v ? "var(--naranja)" : "transparent",
              color: vista === v ? "white" : "var(--muted)",
              border: vista === v ? "none" : "1px solid var(--borde)",
            }}
          >
            {v === "lista"
              ? "Plantilla"
              : v === "asignar"
                ? "Asignar jugador"
                : "Nuevo jugador"}
          </button>
        ))}
      </div>

      {msg && (
        <p style={{ color: "green", fontSize: "13px", marginBottom: "16px" }}>
          {msg}
        </p>
      )}
      {error && (
        <p style={{ color: "red", fontSize: "13px", marginBottom: "16px" }}>
          {error}
        </p>
      )}

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
                .map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nombre} {j.apellido} — {j.posicion}
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
          <div>
            <label
              style={{
                fontSize: "13px",
                fontWeight: 700,
                display: "block",
                marginBottom: "6px",
              }}
            >
              Nombre
            </label>
            <input
              type="text"
              value={nuevoJugador.nombre}
              onChange={(e) =>
                setNuevoJugador({ ...nuevoJugador, nombre: e.target.value })
              }
              placeholder="Carlos"
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
          <div>
            <label
              style={{
                fontSize: "13px",
                fontWeight: 700,
                display: "block",
                marginBottom: "6px",
              }}
            >
              Apellido
            </label>
            <input
              type="text"
              value={nuevoJugador.apellido}
              onChange={(e) =>
                setNuevoJugador({ ...nuevoJugador, apellido: e.target.value })
              }
              placeholder="García"
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
              <option value="Base">Base</option>
              <option value="Escolta">Escolta</option>
              <option value="Alero">Alero</option>
              <option value="Ala-Pívot">Ala-Pívot</option>
              <option value="Pívot">Pívot</option>
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
