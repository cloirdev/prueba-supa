import { useState, useEffect } from "react";
import AdminPartido from "./AdminPartido.jsx";
import FormPartido from "./FormPartido.jsx";

function crearFormInicial(temporada) {
  const nombre = temporada?.temporadas?.nombre ?? temporada?.nombre ?? "";
  // Extrae el primer año: "2009/10" → "2009", "2009-10" → "2009"
  const anyo = nombre.match(/\d{4}/)?.[0] ?? new Date().getFullYear();
  const fechaDefecto = `${anyo}-09-01`; // septiembre, inicio típico de temporada

  return {
    tipo: "liga",
    participante_id: "",
    club_rival_id: "",
    fase_id: "",
    jornada: "",
    fecha: fechaDefecto,
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
  const [participantes, setParticipantes] = useState([]);
  const [clubes, setClubes] = useState([]);
  const [fases, setFases] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [partidoSeleccionado, setPartidoSeleccionado] = useState(null);
  const [vista, setVista] = useState("lista");
  const [form, setForm] = useState(() => crearFormInicial(temporada));
  const [editandoId, setEditandoId] = useState(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargar();
    cargarOpciones();
  }, [equipo.id]);

  async function cargar() {
    setCargando(true);
    const { data, error: err } = await supabase
      .from("partidos")
      .select(
        `
        *,
        participante_local:participantes!participante_local_id (
          id, nombre_equipo, equipo_id, clubes(nombre, logo_url)
        ),
        participante_visitante:participantes!participante_visitante_id (
          id, nombre_equipo, equipo_id, clubes(nombre, logo_url)
        )
      `,
      )
      .eq("equipo_id", equipo.id)
      .order("fecha", { ascending: false });

    if (err) {
      setError("No se pudieron cargar los partidos");
      setCargando(false);
      return;
    }
    setPartidos(data ?? []);
    setCargando(false);
  }

  async function cargarOpciones() {
    const temporadaId = temporada?.temporadas?.id ?? temporada?.id;

    const { data: equipoComps, error: errComps } = await supabase
      .from("equipo_competiciones")
      .select("competicion_id")
      .eq("equipo_id", equipo.id);

    const competicionIds = (equipoComps ?? [])
      .map((ec) => ec.competicion_id)
      .filter(Boolean);

    let fasesData = [];
    if (competicionIds.length > 0) {
      const { data, error: errFases } = await supabase
        .from("fases_competicion")
        .select("id, nombre, tipo, competicion_id, competiciones(nombre)")
        .eq("temporada_id", temporadaId)
        .in("competicion_id", competicionIds);
      fasesData = data ?? [];
    }
    setFases(fasesData);

    // Participantes rivales (sin nuestro equipo)
    if (fasesData.length) {
      const faseIds = fasesData.map((f) => f.id);
      const { data: partsData } = await supabase
        .from("participantes")
        .select(
          "id, nombre_equipo, equipo_id, fase_id, clubes(nombre, logo_url)",
        )
        .in("fase_id", faseIds)
        .or(`equipo_id.is.null,equipo_id.neq.${equipo.id}`)
        .order("nombre_equipo");
      setParticipantes(partsData ?? []);
    } else {
      setParticipantes([]);
    }

    // Clubes para amistosos
    const { data: clubesData } = await supabase
      .from("clubes")
      .select("id, nombre, logo_url")
      .order("nombre");
    setClubes(clubesData ?? []);
  }

  // Nombre del rival resolviendo desde participante → nombre_equipo ?? clubes.nombre
  function nombreRival(p) {
    const participanteRival = p.es_local
      ? p.participante_visitante
      : p.participante_local;
    return (
      participanteRival?.nombre_equipo ??
      participanteRival?.clubes?.nombre ??
      "—"
    );
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
    setForm(crearFormInicial(temporada));
    setEditandoId(null);
    setMsg("");
    setError("");
  }

  function abrirEditar(p, e) {
    e.stopPropagation();
    const pLoc = p.es_local ? p.puntos_favor : p.puntos_contra;
    const pVis = p.es_local ? p.puntos_contra : p.puntos_favor;
    const participanteRival = p.es_local
      ? p.participante_visitante
      : p.participante_local;
    setForm({
      tipo: "liga",
      participante_id: participanteRival?.id ?? "",
      club_rival_id: "",
      fase_id: p.fase_id ?? "",
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

    if (!form.participante_id && !form.club_rival_id) {
      setError("Selecciona un rival");
      return;
    }

    const { puntos_favor, puntos_contra } = form.disputado
      ? calcularPuntos(form)
      : { puntos_favor: null, puntos_contra: null };

    // Para amistosos: buscar o crear participante sin fase
    let participanteRivalId = form.participante_id;
    if (form.tipo === "amistoso" && form.club_rival_id) {
      const { data: existing } = await supabase
        .from("participantes")
        .select("id")
        .eq("club_id", form.club_rival_id)
        .is("fase_id", null)
        .single();

      if (existing) {
        participanteRivalId = existing.id;
      } else {
        const club = clubes.find((c) => c.id === form.club_rival_id);
        const { data: nuevo } = await supabase
          .from("participantes")
          .insert({
            club_id: form.club_rival_id,
            fase_id: null,
            nombre_equipo: club?.nombre ?? null,
          })
          .select("id")
          .single();
        participanteRivalId = nuevo?.id ?? null;
      }
    }

    // Buscar participante propio en la fase (solo si hay fase)
    let participantePropioId = null;
    if (form.fase_id) {
      const { data } = await supabase
        .from("participantes")
        .select("id")
        .eq("fase_id", form.fase_id)
        .eq("equipo_id", equipo.id)
        .single();
      participantePropioId = data?.id ?? null;
    }

    const payload = {
      equipo_id: equipo.id,
      fecha: form.fecha || null,
      es_local: form.es_local,
      puntos_favor,
      puntos_contra,
      fase_id: form.fase_id || null,
      jornada:
        form.tipo === "liga" && !isNaN(parseInt(form.jornada))
          ? parseInt(form.jornada)
          : null,
      ronda:
        form.tipo === "amistoso"
          ? "Amistoso"
          : form.tipo !== "liga"
            ? form.jornada || null
            : null,
      participante_local_id: form.es_local
        ? participantePropioId
        : participanteRivalId,
      participante_visitante_id: form.es_local
        ? participanteRivalId
        : participantePropioId,
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
        participantes={participantes}
        clubes={clubes}
        fases={fases}
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
                      {p.jornada ? `J${p.jornada}` : (p.ronda ?? "—")} ·{" "}
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

      {(vista === "nuevo" || vista === "editar") && (
        <>
          <h2 style={{ marginBottom: "20px", fontSize: "16px" }}>
            {vista === "editar" ? "Editar partido" : "Nuevo partido"}
          </h2>
          <FormPartido
            form={form}
            setForm={setForm}
            participantes={participantes}
            clubes={clubes}
            fases={fases}
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
