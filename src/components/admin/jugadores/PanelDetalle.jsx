import { useState, useEffect, useRef } from "react";
import "./AdminJugadores.css";
import PanelDetalle from "./PanelDetalle.jsx";
import FormNuevoJugador from "./FormNuevoJugador.jsx";

const POSICIONES = ["Base", "Escolta", "Alero", "Ala-Pívot", "Pívot"];
const iniciales = (j) =>
  `${j.nombre?.[0] ?? ""}${j.apellido?.[0] ?? ""}`.toUpperCase();
const equipoLabel = (eq) => eq.sponsor ?? eq.categorias?.nombre ?? "Equipo";

export default function AdminJugadores({ supabase, perfil }) {
  const [jugadores, setJugadores] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [temporadas, setTemporadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroPosicion, setFiltroPosicion] = useState("");
  const [vistaCards, setVistaCards] = useState(false);
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
        `¿Eliminar definitivamente a ${jugadorSeleccionado.nombre} ${jugadorSeleccionado.apellido}?`,
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

  const jugadoresFiltrados = jugadores.filter((j) => {
    const texto = `${j.nombre} ${j.apellido}`.toLowerCase();
    return (
      texto.includes(busqueda.toLowerCase()) &&
      (!filtroPosicion || j.posicion === filtroPosicion)
    );
  });

  if (cargando)
    return <p style={{ color: "var(--muted)" }}>Cargando jugadores...</p>;

  return (
    <div className="jugadores-layout">
      {/* Panel izquierdo */}
      <div
        className="jugadores-lista"
        style={{ width: jugadorSeleccionado ? "360px" : "100%" }}
      >
        {/* Header */}
        <div className="jugadores-header">
          <div>
            <h1>Jugadores</h1>
            <p>
              {jugadoresFiltrados.length} jugador
              {jugadoresFiltrados.length !== 1 ? "es" : ""} encontrado
              {jugadoresFiltrados.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            className={mostrarFormNuevo ? "btn-secondary" : "btn-primary"}
            onClick={() => {
              setMostrarFormNuevo(!mostrarFormNuevo);
              setMsg("");
              setError("");
            }}
          >
            {mostrarFormNuevo ? "Cancelar" : "+ Nuevo jugador"}
          </button>
        </div>

        {/* Form nuevo jugador */}
        {mostrarFormNuevo && (
          <div
            className="card"
            style={{ marginBottom: "20px", maxWidth: "420px" }}
          >
            <FormNuevoJugador
              form={formNuevo}
              onChange={setFormNuevo}
              onSubmit={crearJugador}
              msg={msg}
              error={error}
            />
          </div>
        )}

        {/* Buscador */}
        <div className="buscador-wrapper">
          <span className="buscador-icono">🔍</span>
          <input
            ref={searchRef}
            type="text"
            className="buscador-input"
            placeholder="Buscar jugador..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button className="buscador-clear" onClick={() => setBusqueda("")}>
              ×
            </button>
          )}
        </div>

        {/* Toggle vista */}
        <div
          className="toggle-vista"
          onClick={() => setVistaCards(!vistaCards)}
        >
          <div
            className="toggle-slider"
            style={{ left: vistaCards ? "calc(50%)" : "4px" }}
          />
          <div
            className="toggle-opcion"
            style={{ color: !vistaCards ? "white" : "var(--muted)" }}
          >
            ☰
          </div>
          <div
            className="toggle-opcion"
            style={{ color: vistaCards ? "white" : "var(--muted)" }}
          >
            ⊞
          </div>
        </div>

        {/* Filtro posición */}
        <div className="filtro-wrapper">
          <label className="filtro-label">Filtrar por posición</label>
          <select
            className="campo"
            value={filtroPosicion}
            onChange={(e) => setFiltroPosicion(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: `1px solid ${filtroPosicion ? "var(--naranja)" : "var(--borde)"}`,
              background: filtroPosicion
                ? "rgba(249,115,22,0.05)"
                : "var(--card)",
              color: "var(--texto)",
              fontSize: "13px",
              boxSizing: "border-box",
              cursor: "pointer",
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

        {/* Lista */}
        <div className={`jugadores-scroll ${vistaCards ? "cards" : "lista"}`}>
          {jugadoresFiltrados.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>
              No hay jugadores que coincidan.
            </p>
          )}
          {jugadoresFiltrados.map((j) => {
            const sel = jugadorSeleccionado?.id === j.id;
            return (
              <div
                key={j.id}
                onClick={() => abrirJugador(j)}
                className={`jugador-card ${vistaCards ? "cards" : "lista"} ${sel ? "seleccionado" : ""}`}
                style={{
                  width: vistaCards
                    ? jugadorSeleccionado
                      ? "calc(50% - 10px)"
                      : "calc(10% - 10px)"
                    : "100%",
                }}
              >
                <div
                  className={`jugador-avatar ${vistaCards ? "md" : "sm"} ${sel ? "seleccionado" : ""}`}
                >
                  {iniciales(j)}
                </div>
                <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
                  <div
                    className="jugador-nombre"
                    style={{
                      fontSize: vistaCards ? "12px" : "13px",
                      color: sel ? "var(--naranja)" : "var(--texto)",
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
                    className="jugador-posicion-badge"
                    style={{ marginTop: vistaCards ? "4px" : "0" }}
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
        <PanelDetalle
          jugador={jugadorSeleccionado}
          historial={historial}
          cargandoHistorial={cargandoHistorial}
          panelVista={panelVista}
          setPanelVista={(v) => {
            setPanelVista(v);
            setMsg("");
            setError("");
          }}
          formEditar={formEditar}
          setFormEditar={setFormEditar}
          onGuardar={guardarEdicion}
          onEliminarJugador={eliminarJugador}
          formAsignar={formAsignar}
          setFormAsignar={setFormAsignar}
          onAsignar={asignarTemporada}
          onEliminarAsignacion={eliminarAsignacion}
          equipos={equipos}
          temporadas={temporadas}
          equipoLabel={equipoLabel}
          perfil={perfil}
          msg={msg}
          error={error}
          onCerrar={() => setJugadorSeleccionado(null)}
        />
      )}
    </div>
  );
}
