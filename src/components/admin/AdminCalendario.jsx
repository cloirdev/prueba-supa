import { useState, useEffect } from "react";
import AdminPartido from "./AdminPartido.jsx";
import FormPartido from "./FormPartido.jsx";

function crearFormInicial() {
  return {
    rival_id: "",
    tipo: "liga",
    jornada: "",
    fecha: "",
    es_local: true,
    disputado: false,
    puntos_local: "",
    puntos_visitante: "",
  };
}

export default function AdminCalendario({
  supabase,
  perfil,
  equipo,
  temporada,
  onBack,
}) {
  const [partidos, setPartidos] = useState([]);
  const [rivales, setRivales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [partidoSeleccionado, setPartidoSeleccionado] = useState(null);
  const [vista, setVista] = useState("lista");
  const [form, setForm] = useState(crearFormInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargar();
    cargarRivales();
  }, [temporada.id]);

  async function cargar() {
    setCargando(true);
    const { data, error: err } = await supabase
      .from("partidos")
      .select(`*, equipos_rivales (id, nombre_equipo, clubes (nombre))`)
      .eq("equipo_id", equipo.id) // ← solo este filtro, equipo ya implica temporada
      .order("fecha", { ascending: false });
    if (err) {
      setError("No se pudieron cargar los partidos");
      setCargando(false);
      return;
    }
    setPartidos(data ?? []);
    setCargando(false);
  }

  async function cargarRivales() {
    if (!equipo.categoria_id) return;
    const { data } = await supabase
      .from("equipos_rivales")
      .select("id, nombre_equipo, clubes (nombre), categorias (nombre)")
      .eq("categoria_id", equipo.categoria_id)
      .order("nombre_equipo");
    setRivales(data ?? []);
  }

  function calcularPuntos(f) {
    const pLoc = parseInt(f.puntos_local) || 0;
    const pVis = parseInt(f.puntos_visitante) || 0;
    return {
      puntos_favor: f.es_local ? pLoc : pVis,
      puntos_contra: f.es_local ? pVis : pLoc,
    };
  }

  function abrirNuevo() {
    setVista("nuevo");
    setForm(crearFormInicial());
    setEditandoId(null);
    setMsg("");
    setError("");
  }

  function abrirEditar(p, e) {
    e.stopPropagation();
    const pLoc = p.es_local ? p.puntos_favor : p.puntos_contra;
    const pVis = p.es_local ? p.puntos_contra : p.puntos_favor;
    setForm({
      rival_id: p.equipo_rival_id ?? "",
      tipo: p.ronda === "Amistoso" ? "amistoso" : p.ronda ? "playoff" : "liga",
      jornada: p.jornada ?? p.ronda ?? "",
      fecha: p.fecha ?? "",
      es_local: p.es_local ?? true,
      disputado: p.puntos_favor !== null,
      puntos_local: pLoc ?? "",
      puntos_visitante: pVis ?? "",
    });
    setEditandoId(p.id);
    setVista("editar");
    setMsg("");
    setError("");
  }

  function volverLista() {
    setVista("lista");
    setMsg("");
    setError("");
    setEditandoId(null);
  }

  async function guardar() {
    setError("");
    setMsg("");

    if (!form.rival_id) {
      setError("Selecciona un rival");
      return;
    }
    if (form.tipo === "liga") {
      const jornada = Number.parseInt(form.jornada, 10);
      if (!form.jornada || Number.isNaN(jornada) || jornada < 1) {
        setError("La jornada debe ser un número mayor que 0");
        return;
      }
    }
    if ((form.tipo === "copa" || form.tipo === "playoff") && !form.jornada) {
      setError("Selecciona una ronda");
      return;
    }
    if (
      form.disputado &&
      (form.puntos_local === "" || form.puntos_visitante === "")
    ) {
      setError("Introduce los puntos del partido");
      return;
    }

    const rivalObj = rivales.find((r) => r.id === form.rival_id);
    const rivalNombre =
      rivalObj?.nombre_equipo ?? rivalObj?.clubes?.nombre ?? "—";
    const { puntos_favor, puntos_contra } = form.disputado
      ? calcularPuntos(form)
      : { puntos_favor: null, puntos_contra: null };

    const payload = {
      equipo_id: equipo.id,
      equipo_rival_id: form.rival_id,
      rival: rivalNombre,
      fecha: form.fecha || null,
      es_local: form.es_local,
      puntos_favor,
      puntos_contra,
      jornada: form.tipo === "liga" ? parseInt(form.jornada) || null : null,
      ronda:
        form.tipo === "amistoso"
          ? "Amistoso"
          : form.tipo !== "liga"
            ? form.jornada || null
            : null,
    };

    const { error: err } =
      vista === "editar" && editandoId
        ? await supabase.from("partidos").update(payload).eq("id", editandoId)
        : await supabase.from("partidos").insert(payload);

    if (err) {
      setError(err.message ?? "Error al guardar");
      return;
    }

    volverLista();
    await cargar();
    setMsg(vista === "editar" ? "Partido actualizado" : "Partido creado");
  }

  const nombreRival = (p) =>
    p.equipos_rivales?.nombre_equipo ??
    p.equipos_rivales?.clubes?.nombre ??
    p.rival;
  const pLocal = (p) => (p.es_local ? p.puntos_favor : p.puntos_contra);
  const pVis = (p) => (p.es_local ? p.puntos_contra : p.puntos_favor);

  if (partidoSeleccionado)
    return (
      <AdminPartido
        supabase={supabase}
        perfil={perfil}
        equipo={equipo}
        temporada={temporada}
        partido={partidoSeleccionado}
        rivales={rivales}
        onBack={() => {
          setPartidoSeleccionado(null);
          cargar();
        }}
      />
    );

  if (cargando)
    return <p style={{ color: "var(--muted)" }}>Cargando partidos...</p>;

  return (
    <div>
      <button onClick={onBack} className="adm-back-btn">
        ← Volver
      </button>

      <div className="adm-header">
        <div>
          <h1 className="adm-page-title">Calendario</h1>
          <p className="adm-page-subtitle">
            {equipo.sponsor ?? equipo.categorias?.nombre} ·{" "}
            {temporada.temporadas?.nombre ?? temporada.nombre}
          </p>
        </div>
        {vista === "lista" ? (
          <button onClick={abrirNuevo} className="adm-btn-primary">
            + Nuevo partido
          </button>
        ) : (
          <button onClick={volverLista} className="adm-btn-secondary">
            ← Volver a lista
          </button>
        )}
      </div>

      {msg && <p className="adm-msg-success">{msg}</p>}
      {error && <p className="adm-msg-error">{error}</p>}

      {/* ── Lista ── */}
      {vista === "lista" && (
        <>
          {partidos.length === 0 && (
            <p className="adm-empty">No hay partidos registrados.</p>
          )}
          <div className="adm-list">
            {partidos.map((p) => {
              const disputado = p.puntos_favor !== null;
              const ploc = pLocal(p);
              const pvis = pVis(p);
              const victoria = disputado && ploc > pvis;
              const fechaStr = p.fecha
                ? new Date(p.fecha).toLocaleDateString("es-ES", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })
                : "Sin fecha";

              return (
                <div
                  key={p.id}
                  onClick={() => setPartidoSeleccionado(p)}
                  className="card adm-card-row adm-card-clickable"
                >
                  <div style={{ flex: 1 }}>
                    <div className="adm-card-title">
                      {p.es_local ? "vs" : "@"} {nombreRival(p)}
                    </div>
                    <div className="adm-card-subtitle">
                      {fechaStr} ·{" "}
                      {p.jornada ? `J${p.jornada}` : (p.ronda ?? "Amistoso")} ·{" "}
                      {p.es_local ? "Local" : "Visitante"}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    {disputado ? (
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          color: victoria ? "var(--naranja)" : "var(--azul)",
                        }}
                      >
                        <span style={{ opacity: ploc >= pvis ? 1 : 0.35 }}>
                          {ploc}
                        </span>
                        <span style={{ opacity: 0.35, fontSize: "14px" }}>
                          –
                        </span>
                        <span style={{ opacity: pvis >= ploc ? 1 : 0.35 }}>
                          {pvis}
                        </span>
                      </div>
                    ) : (
                      <span className="adm-pill adm-pill--muted">
                        Pendiente
                      </span>
                    )}
                    <button
                      onClick={(e) => abrirEditar(p, e)}
                      className="adm-btn-secondary"
                      style={{ padding: "4px 10px", fontSize: "11px" }}
                    >
                      Editar
                    </button>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                      ›
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Formulario ── */}
      {(vista === "nuevo" || vista === "editar") && (
        <>
          <h2 style={{ marginBottom: "20px", fontSize: "16px" }}>
            {vista === "editar" ? "Editar partido" : "Nuevo partido"}
          </h2>
          <FormPartido
            form={form}
            setForm={setForm}
            rivales={rivales}
            equipo={equipo}
            vista={vista}
            onGuardar={guardar}
            onCancelar={volverLista}
          />
        </>
      )}
    </div>
  );
}
