import { useState, useEffect } from "react";
import FormPartido from "./FormPartido.jsx";

// ── Helpers ────────────────────────────────────────────────────────────────
function minutosASegundos(val) {
  const str = String(val ?? "0");
  if (str.includes(":")) {
    const [mm, ss] = str.split(":");
    return (parseInt(mm) || 0) * 60 + (parseInt(ss) || 0);
  }
  return (parseInt(str) || 0) * 60;
}

function segundosADisplay(totalSegs) {
  const mm = Math.floor(totalSegs / 60);
  const ss = totalSegs % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function calcularValoracion(s) {
  const tcAn =
    parseInt(s.tiros_campo_anotados ?? 0) + parseInt(s.triples_anotados ?? 0);
  const tcInt =
    parseInt(s.tiros_campo_intentados ?? 0) +
    parseInt(s.triples_intentados ?? 0);
  const pts =
    parseInt(s.tiros_libres_anotados ?? 0) * 1 +
    parseInt(s.tiros_campo_anotados ?? 0) * 2 +
    parseInt(s.triples_anotados ?? 0) * 3;
  const rt =
    parseInt(s.rebotes_ofensivos ?? 0) + parseInt(s.rebotes_defensivos ?? 0);
  return (
    pts +
    rt +
    parseInt(s.asistencias ?? 0) +
    parseInt(s.robos ?? 0) +
    parseInt(s.tapones ?? 0) +
    parseInt(s.faltas_recibidas ?? 0) +
    (parseInt(s.tiros_libres_anotados ?? 0) -
      parseInt(s.tiros_libres_intentados ?? 0)) +
    (tcAn - tcInt) -
    parseInt(s.faltas_cometidas ?? 0) -
    parseInt(s.perdidas ?? 0)
  );
}

// Resuelve el nombre de un participante: nombre_equipo manual ?? nombre del club
function nombreParticipante(p) {
  if (!p) return "—";
  return p.nombre_equipo ?? p.clubes?.nombre ?? "—";
}

// ── Celda clicable simple ──────────────────────────────────────────────────
function Celda({ value, onInc, onDec, color }) {
  function handleContextMenu(e) {
    e.preventDefault();
    onDec();
  }
  return (
    <td
      onClick={onInc}
      onContextMenu={handleContextMenu}
      style={{
        padding: "0",
        textAlign: "center",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <div
        style={{
          padding: "10px 8px",
          fontSize: "13px",
          fontWeight: 700,
          color: color ?? "var(--texto)",
          borderRadius: "4px",
          transition: "background .08s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background =
            "var(--color-background-secondary)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        {value ?? 0}
      </div>
    </td>
  );
}

// ── Celda de tiro: mitad izq = anotados, mitad der = intentados ─────────
function CeldaTiro({ an, int_, onIncAn, onDecAn, onIncInt, onDecInt }) {
  function getZone(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    return e.clientX < rect.left + rect.width / 2 ? "an" : "int";
  }
  function handleClick(e) {
    getZone(e) === "an" ? onIncAn() : onIncInt();
  }
  function handleContextMenu(e) {
    e.preventDefault();
    getZone(e) === "an" ? onDecAn() : onDecInt();
  }
  return (
    <td
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      style={{
        padding: "0",
        textAlign: "center",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <div
        style={{
          padding: "10px 8px",
          borderRadius: "4px",
          transition: "background .08s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background =
            "var(--color-background-secondary)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span
          style={{ fontSize: "13px", fontWeight: 700, color: "var(--texto)" }}
        >
          {an}
        </span>
        <span
          style={{ fontSize: "11px", color: "var(--borde)", margin: "0 2px" }}
        >
          /
        </span>
        <span
          style={{ fontSize: "13px", fontWeight: 600, color: "var(--muted)" }}
        >
          {int_}
        </span>
      </div>
    </td>
  );
}

// ── Celda calculada (solo lectura) ────────────────────────────────────────
function CeldaCalc({ value, color }) {
  return (
    <td
      style={{
        padding: "10px 8px",
        textAlign: "center",
        fontSize: "13px",
        fontWeight: 800,
        color: color ?? "var(--texto)",
      }}
    >
      {value}
    </td>
  );
}

// ── FilaJugador ────────────────────────────────────────────────────────────
function FilaJugador({ c, stats, setStats, toggleConvocado }) {
  const s = stats[c.jugadores.id] ?? {};
  const esTitular = s.titular ?? false;

  const ptsTotal =
    parseInt(s.tiros_libres_anotados ?? 0) +
    parseInt(s.tiros_campo_anotados ?? 0) * 2 +
    parseInt(s.triples_anotados ?? 0) * 3;
  const rt =
    parseInt(s.rebotes_ofensivos ?? 0) + parseInt(s.rebotes_defensivos ?? 0);
  const val = calcularValoracion(s);
  const masMenos = parseInt(s.mas_menos ?? 0);

  function update(campo, v) {
    setStats((prev) => ({
      ...prev,
      [c.jugadores.id]: { ...prev[c.jugadores.id], [campo]: v },
    }));
  }
  function inc(campo, min = 0) {
    update(campo, Math.max(min, parseInt(s[campo] ?? 0) + 1));
  }
  function dec(campo, min = 0) {
    update(campo, Math.max(min, parseInt(s[campo] ?? 0) - 1));
  }

  return (
    <tr
      style={{
        borderBottom: "1px solid var(--borde)",
        background: esTitular ? "rgba(242,130,65,.03)" : "transparent",
      }}
    >
      {/* Nombre */}
      <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => update("titular", !esTitular)}
            title={esTitular ? "Quitar titular" : "Marcar titular"}
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              flexShrink: 0,
              background: esTitular ? "#1e3a5f" : "transparent",
              border: esTitular ? "none" : "1px solid var(--borde)",
              color: esTitular ? "var(--naranja)" : "var(--muted)",
              fontWeight: 800,
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            {c.dorsal}
          </button>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700 }}>
              {c.jugadores.nombre[0]}. {c.jugadores.apellido}
            </div>
            <div style={{ fontSize: "10px", color: "var(--muted)" }}>
              {c.jugadores.posicion ?? "—"}
            </div>
          </div>
        </div>
      </td>

      {/* MIN */}
      <td style={{ padding: "6px", textAlign: "center" }}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="00:00"
          value={s.minutos ?? ""}
          onChange={(e) =>
            update(
              "minutos",
              e.target.value.replace(/[^0-9:]/g, "").slice(0, 5),
            )
          }
          onBlur={(e) => {
            const raw = e.target.value;
            if (!raw) return;
            let norm;
            if (!raw.includes(":")) {
              norm = `${String(parseInt(raw) || 0).padStart(2, "0")}:00`;
            } else {
              const [mm, ss] = raw.split(":");
              norm = `${String(parseInt(mm) || 0).padStart(2, "0")}:${String(Math.min(parseInt(ss) || 0, 59)).padStart(2, "0")}`;
            }
            update("minutos", norm);
          }}
          style={{
            width: "46px",
            padding: "5px 4px",
            borderRadius: "5px",
            border: "1px solid var(--borde)",
            background: "var(--fondo)",
            color: "var(--texto)",
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: "monospace",
            textAlign: "center",
          }}
        />
      </td>

      <CeldaCalc
        value={ptsTotal}
        color={ptsTotal > 0 ? "var(--naranja)" : "var(--muted)"}
      />
      <CeldaTiro
        an={parseInt(s.tiros_campo_anotados ?? 0)}
        int_={parseInt(s.tiros_campo_intentados ?? 0)}
        onIncAn={() => inc("tiros_campo_anotados")}
        onDecAn={() => dec("tiros_campo_anotados")}
        onIncInt={() => inc("tiros_campo_intentados")}
        onDecInt={() => dec("tiros_campo_intentados")}
      />
      <CeldaTiro
        an={parseInt(s.triples_anotados ?? 0)}
        int_={parseInt(s.triples_intentados ?? 0)}
        onIncAn={() => inc("triples_anotados")}
        onDecAn={() => dec("triples_anotados")}
        onIncInt={() => inc("triples_intentados")}
        onDecInt={() => dec("triples_intentados")}
      />
      <CeldaTiro
        an={parseInt(s.tiros_libres_anotados ?? 0)}
        int_={parseInt(s.tiros_libres_intentados ?? 0)}
        onIncAn={() => inc("tiros_libres_anotados")}
        onDecAn={() => dec("tiros_libres_anotados")}
        onIncInt={() => inc("tiros_libres_intentados")}
        onDecInt={() => dec("tiros_libres_intentados")}
      />
      <Celda
        value={parseInt(s.rebotes_ofensivos ?? 0)}
        onInc={() => inc("rebotes_ofensivos")}
        onDec={() => dec("rebotes_ofensivos")}
      />
      <Celda
        value={parseInt(s.rebotes_defensivos ?? 0)}
        onInc={() => inc("rebotes_defensivos")}
        onDec={() => dec("rebotes_defensivos")}
      />
      <CeldaCalc value={rt} color={rt > 0 ? "var(--azul)" : "var(--muted)"} />
      <Celda
        value={parseInt(s.asistencias ?? 0)}
        onInc={() => inc("asistencias")}
        onDec={() => dec("asistencias")}
      />
      <Celda
        value={parseInt(s.robos ?? 0)}
        onInc={() => inc("robos")}
        onDec={() => dec("robos")}
      />
      <Celda
        value={parseInt(s.perdidas ?? 0)}
        onInc={() => inc("perdidas")}
        onDec={() => dec("perdidas")}
        color="var(--muted)"
      />
      <Celda
        value={parseInt(s.tapones ?? 0)}
        onInc={() => inc("tapones")}
        onDec={() => dec("tapones")}
      />
      <Celda
        value={parseInt(s.faltas_cometidas ?? 0)}
        onInc={() => inc("faltas_cometidas")}
        onDec={() => dec("faltas_cometidas")}
        color="var(--muted)"
      />
      <Celda
        value={parseInt(s.faltas_recibidas ?? 0)}
        onInc={() => inc("faltas_recibidas")}
        onDec={() => dec("faltas_recibidas")}
      />
      <CeldaCalc
        value={val > 0 ? `+${val}` : val}
        color={val > 0 ? "#0baa3b" : val < 0 ? "#ef4444" : "var(--muted)"}
      />
      <Celda
        value={masMenos > 0 ? `+${masMenos}` : masMenos}
        onInc={() => update("mas_menos", masMenos + 1)}
        onDec={() => update("mas_menos", masMenos - 1)}
        color={
          masMenos > 0 ? "#0baa3b" : masMenos < 0 ? "#ef4444" : "var(--muted)"
        }
      />
      <td style={{ padding: "6px 8px", textAlign: "center" }}>
        <button
          onClick={() => toggleConvocado(c.jugadores.id)}
          style={{
            background: "transparent",
            border: "1px solid var(--borde)",
            borderRadius: "6px",
            padding: "3px 7px",
            cursor: "pointer",
            fontSize: "11px",
            color: "var(--muted)",
          }}
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

// ── Fila de totales ────────────────────────────────────────────────────────
function FilaTotales({ lista, stats }) {
  const sum = (campo) =>
    lista.reduce(
      (a, c) => a + parseInt(stats[c.jugadores.id]?.[campo] ?? 0),
      0,
    );
  const sumPts = () =>
    lista.reduce((a, c) => {
      const s = stats[c.jugadores.id] ?? {};
      return (
        a +
        parseInt(s.tiros_libres_anotados ?? 0) +
        parseInt(s.tiros_campo_anotados ?? 0) * 2 +
        parseInt(s.triples_anotados ?? 0) * 3
      );
    }, 0);
  const sumVal = () =>
    lista.reduce(
      (a, c) => a + calcularValoracion(stats[c.jugadores.id] ?? {}),
      0,
    );
  const sumMin = () =>
    segundosADisplay(
      lista.reduce(
        (a, c) => a + minutosASegundos(stats[c.jugadores.id]?.minutos ?? "0"),
        0,
      ),
    );

  const st = {
    padding: "8px 8px",
    textAlign: "center",
    fontSize: "12px",
    fontWeight: 700,
    color: "var(--muted)",
    background: "var(--color-background-secondary)",
  };
  const tv = sumVal();

  return (
    <tr style={{ borderTop: "1.5px solid var(--borde)" }}>
      <td
        style={{
          ...st,
          textAlign: "left",
          padding: "8px 10px",
          fontSize: "10px",
          letterSpacing: ".06em",
          textTransform: "uppercase",
        }}
      >
        TOTAL
      </td>
      <td style={{ ...st, fontFamily: "monospace" }}>{sumMin()}</td>
      <td style={{ ...st, color: "var(--naranja)" }}>{sumPts()}</td>
      <td style={st}>
        {sum("tiros_campo_anotados")}/{sum("tiros_campo_intentados")}
      </td>
      <td style={st}>
        {sum("triples_anotados")}/{sum("triples_intentados")}
      </td>
      <td style={st}>
        {sum("tiros_libres_anotados")}/{sum("tiros_libres_intentados")}
      </td>
      <td style={st}>{sum("rebotes_ofensivos")}</td>
      <td style={st}>{sum("rebotes_defensivos")}</td>
      <td style={{ ...st, color: "var(--azul)" }}>
        {sum("rebotes_ofensivos") + sum("rebotes_defensivos")}
      </td>
      <td style={st}>{sum("asistencias")}</td>
      <td style={st}>{sum("robos")}</td>
      <td style={st}>{sum("perdidas")}</td>
      <td style={st}>{sum("tapones")}</td>
      <td style={st}>{sum("faltas_cometidas")}</td>
      <td style={st}>{sum("faltas_recibidas")}</td>
      <td
        style={{
          ...st,
          color: tv > 0 ? "#0baa3b" : tv < 0 ? "#ef4444" : "var(--muted)",
        }}
      >
        {tv > 0 ? `+${tv}` : tv}
      </td>
      <td style={st} />
      <td style={st} />
    </tr>
  );
}

// ── Cabecera de sección ────────────────────────────────────────────────────
const HEADERS = [
  "MIN",
  "PTS",
  "T2",
  "3PT",
  "TL",
  "OREB",
  "DREB",
  "REB",
  "AST",
  "ROB",
  "PER",
  "TAP",
  "FC",
  "FR",
  "VAL",
  "+/−",
  "",
];

function CabeceraSeccion({ titulo }) {
  const thSt = {
    padding: "6px 8px",
    fontSize: "10px",
    fontWeight: 700,
    color: "var(--muted)",
    textAlign: "center",
    whiteSpace: "nowrap",
    letterSpacing: ".06em",
  };
  return (
    <>
      <tr>
        <td
          colSpan={HEADERS.length + 1}
          style={{
            padding: "16px 10px 4px",
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: ".1em",
            color: "var(--naranja)",
            textTransform: "uppercase",
          }}
        >
          {titulo}
        </td>
      </tr>
      <tr style={{ borderBottom: "1.5px solid var(--borde)" }}>
        <th
          style={{
            ...thSt,
            textAlign: "left",
            minWidth: "160px",
            padding: "6px 10px",
          }}
        />
        {HEADERS.map((h) => (
          <th key={h} style={thSt}>
            {h}
          </th>
        ))}
      </tr>
    </>
  );
}

// ── AdminPartido ───────────────────────────────────────────────────────────
export default function AdminPartido({
  supabase,
  perfil,
  equipo,
  temporada,
  partido,
  // participantes: lista completa de participantes de la fase/temporada
  // (se usa para el selector de rival en "editar partido")
  participantes = [],
  clubes = [],
  fases = [],
  onBack,
}) {
  const [seccion, setSeccion] = useState("resultado");

  // Participante rival: local o visitante según es_local
  const participanteRival = partido.es_local
    ? partido.participante_visitante
    : partido.participante_local;

  // Para amistosos sin participante, fallback al club_rival (si existe)
  const nombreRivalPartido =
    nombreParticipante(participanteRival) ??
    partido.clubes_rival?.nombre ??
    partido.rival ??
    "Rival";

  const nombreEquipo =
    equipo.sponsor ?? equipo.categorias?.nombre ?? "Nosotros";

  const labelLocal = partido.es_local
    ? `${nombreEquipo} (local)`
    : `${nombreRivalPartido} (local)`;
  const labelVisitante = partido.es_local
    ? `${nombreRivalPartido} (visitante)`
    : `${nombreEquipo} (visitante)`;

  const [resultado, setResultado] = useState({
    puntos_local: partido.es_local
      ? (partido.puntos_favor ?? "")
      : (partido.puntos_contra ?? ""),
    puntos_visitante: partido.es_local
      ? (partido.puntos_contra ?? "")
      : (partido.puntos_favor ?? ""),
  });

  const [formEditar, setFormEditar] = useState({
    // Para partidos de competición usamos participante_id (el rival)
    participante_id: partido.es_local
      ? (partido.participante_visitante_id ?? "")
      : (partido.participante_local_id ?? ""),
    // Para amistosos usamos club_rival_id
    club_rival_id: partido.club_rival_id_nuevo ?? partido.club_rival_id ?? "",
    fase_id: partido.fase_id ?? partido.fase_competicion_id ?? "",
    tipo: partido.tipo === "amistoso" ? "amistoso" : (partido.tipo ?? "liga"),
    jornada: partido.jornada ?? partido.ronda ?? "",
    fecha: partido.fecha ?? "",
    es_local: partido.es_local ?? true,
    disputado: partido.puntos_favor !== null,
    puntos_local: partido.es_local
      ? (partido.puntos_favor ?? "")
      : (partido.puntos_contra ?? ""),
    puntos_visitante: partido.es_local
      ? (partido.puntos_contra ?? "")
      : (partido.puntos_favor ?? ""),
  });

  const [cronica, setCronica] = useState("");
  const [jugadores, setJugadores] = useState([]);
  const [stats, setStats] = useState({});
  const [fotos, setFotos] = useState([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    const temporadaId = temporada?.temporadas?.id ?? temporada?.id;
    const [
      { data: conv },
      { data: cronData },
      { data: fotosData },
      { data: statsData },
    ] = await Promise.all([
      supabase
        .from("convocatorias_temporada")
        .select("dorsal, jugadores (id, nombre, apellido, posicion)")
        .eq("equipo_id", equipo.id)
        .eq("temporada_id", temporadaId)
        .order("dorsal"),
      supabase
        .from("cronicas")
        .select("*")
        .eq("partido_id", partido.id)
        .single(),
      supabase.from("fotos").select("*").eq("partido_id", partido.id),
      supabase
        .from("convocatorias_partido")
        .select("*")
        .eq("partido_id", partido.id),
    ]);

    setJugadores(conv ?? []);
    if (cronData) setCronica(cronData.contenido ?? "");

    const statsMap = {};
    (conv ?? []).forEach((c) => {
      statsMap[c.jugadores.id] = { convocado: true };
    });
    (statsData ?? []).forEach((s) => {
      statsMap[s.jugador_id] = {
        ...statsMap[s.jugador_id],
        ...s,
        tiros_campo_anotados: s.tiros_2_anotados ?? s.tiros_campo_anotados ?? 0,
        tiros_campo_intentados:
          s.tiros_2_intentados ?? s.tiros_campo_intentados ?? 0,
        minutos: segundosADisplay(parseInt(s.minutos ?? 0)),
        convocado: true,
      };
    });
    setStats(statsMap);
    setFotos(fotosData ?? []);
    setCargando(false);
  }

  async function guardarResultado() {
    setError("");
    setMsg("");
    const { error: err } = await supabase
      .from("partidos")
      .update({
        puntos_favor: partido.es_local
          ? parseInt(resultado.puntos_local)
          : parseInt(resultado.puntos_visitante),
        puntos_contra: partido.es_local
          ? parseInt(resultado.puntos_visitante)
          : parseInt(resultado.puntos_local),
      })
      .eq("id", partido.id);
    if (err) {
      setError("Error al guardar resultado");
      return;
    }
    setMsg("Resultado guardado");
  }

  async function guardarEdicionPartido() {
    setError("");
    setMsg("");
    const f = formEditar;

    // Validaciones
    if (f.tipo !== "amistoso" && !f.participante_id) {
      setError("Selecciona un rival");
      return;
    }
    if (f.tipo === "amistoso" && !f.club_rival_id) {
      setError("Selecciona un club rival");
      return;
    }
    if (f.tipo === "liga") {
      const j = parseInt(f.jornada, 10);
      if (!f.jornada || isNaN(j) || j < 1) {
        setError("La jornada debe ser un número mayor que 0");
        return;
      }
    }
    if ((f.tipo === "copa" || f.tipo === "playoff") && !f.jornada) {
      setError("Selecciona una ronda");
      return;
    }
    if (f.disputado && (f.puntos_local === "" || f.puntos_visitante === "")) {
      setError("Introduce los puntos");
      return;
    }

    const pLoc = parseInt(f.puntos_local) || 0;
    const pVis = parseInt(f.puntos_visitante) || 0;
    const { puntos_favor, puntos_contra } = f.disputado
      ? {
          puntos_favor: f.es_local ? pLoc : pVis,
          puntos_contra: f.es_local ? pVis : pLoc,
        }
      : { puntos_favor: null, puntos_contra: null };

    // Construir local/visitante según es_local y tipo
    // En partidos de competición, nuestro equipo siempre tiene su participante_id propio
    // que viene del padre. El rival es el participante seleccionado.
    const participanteLocalId =
      f.tipo !== "amistoso"
        ? f.es_local
          ? null
          : f.participante_id // null = nuestro equipo (se resuelve en BD)
        : null;
    const participanteVisitanteId =
      f.tipo !== "amistoso" ? (f.es_local ? f.participante_id : null) : null;

    // Nombre del rival para el campo texto (fallback legacy)
    const rivalObj = participantes.find((p) => p.id === f.participante_id);
    const rivalClub = clubes.find((c) => c.id === f.club_rival_id);
    const rivalNombre =
      f.tipo === "amistoso"
        ? (rivalClub?.nombre ?? "Amistoso")
        : (nombreParticipante(rivalObj) ?? "Rival");

    const { error: err } = await supabase
      .from("partidos")
      .update({
        rival: rivalNombre,
        es_local: f.es_local,
        fecha: f.fecha || null,
        tipo: f.tipo,
        puntos_favor,
        puntos_contra,
        jornada: f.tipo === "liga" ? parseInt(f.jornada) || null : null,
        ronda:
          f.tipo === "amistoso"
            ? "Amistoso"
            : f.tipo !== "liga"
              ? f.jornada || null
              : null,
        fase_competicion_id: f.fase_id || null,
        // Participantes local/visitante (competición)
        participante_local_id: f.es_local
          ? partido.participante_local_id // nuestro equipo, no cambia
          : f.tipo !== "amistoso"
            ? f.participante_id
            : null,
        participante_visitante_id: f.es_local
          ? f.tipo !== "amistoso"
            ? f.participante_id
            : null
          : partido.participante_visitante_id, // nuestro equipo, no cambia
        // Amistoso: guardar club rival
        club_rival_id_nuevo:
          f.tipo === "amistoso" ? f.club_rival_id || null : null,
      })
      .eq("id", partido.id);

    if (err) {
      setError(err.message ?? "Error al guardar");
      return;
    }
    setMsg("Partido actualizado correctamente");
  }

  async function guardarCronica(publicada = false) {
    setError("");
    setMsg("");
    const { data: existing } = await supabase
      .from("cronicas")
      .select("id")
      .eq("partido_id", partido.id)
      .single();
    if (existing) {
      await supabase
        .from("cronicas")
        .update({ contenido: cronica, publicada })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("cronicas")
        .insert({ partido_id: partido.id, contenido: cronica, publicada });
    }
    setMsg(publicada ? "Crónica publicada" : "Crónica guardada como borrador");
  }

  async function guardarStats(jugadorId) {
    const s = stats[jugadorId] ?? {};
    const ptsTotal =
      parseInt(s.tiros_libres_anotados ?? 0) +
      parseInt(s.tiros_campo_anotados ?? 0) * 2 +
      parseInt(s.triples_anotados ?? 0) * 3;
    const tcAn =
      parseInt(s.tiros_campo_anotados ?? 0) + parseInt(s.triples_anotados ?? 0);
    const tcInt =
      parseInt(s.tiros_campo_intentados ?? 0) +
      parseInt(s.triples_intentados ?? 0);
    const rebTotales =
      parseInt(s.rebotes_ofensivos ?? 0) + parseInt(s.rebotes_defensivos ?? 0);

    const { data: existing } = await supabase
      .from("convocatorias_partido")
      .select("id")
      .eq("partido_id", partido.id)
      .eq("jugador_id", jugadorId)
      .single();

    const payload = {
      partido_id: partido.id,
      jugador_id: jugadorId,
      equipo_id: equipo.id,
      titular: s.titular ?? false,
      minutos: minutosASegundos(s.minutos),
      puntos: ptsTotal,
      triples_intentados: parseInt(s.triples_intentados ?? 0),
      triples_anotados: parseInt(s.triples_anotados ?? 0),
      tiros_2_intentados: parseInt(s.tiros_campo_intentados ?? 0),
      tiros_2_anotados: parseInt(s.tiros_campo_anotados ?? 0),
      tiros_campo_intentados: tcInt,
      tiros_campo_anotados: tcAn,
      tiros_libres_intentados: parseInt(s.tiros_libres_intentados ?? 0),
      tiros_libres_anotados: parseInt(s.tiros_libres_anotados ?? 0),
      rebotes_ofensivos: parseInt(s.rebotes_ofensivos ?? 0),
      rebotes_defensivos: parseInt(s.rebotes_defensivos ?? 0),
      rebotes_totales: rebTotales,
      asistencias: parseInt(s.asistencias ?? 0),
      robos: parseInt(s.robos ?? 0),
      tapones: parseInt(s.tapones ?? 0),
      perdidas: parseInt(s.perdidas ?? 0),
      faltas_cometidas: parseInt(s.faltas_cometidas ?? 0),
      faltas_recibidas: parseInt(s.faltas_recibidas ?? 0),
      mas_menos: parseInt(s.mas_menos ?? 0),
      valoracion: calcularValoracion(s),
    };
    if (existing) {
      await supabase
        .from("convocatorias_partido")
        .update(payload)
        .eq("id", existing.id);
    } else {
      await supabase.from("convocatorias_partido").insert(payload);
    }
  }

  async function subirFoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const nombre = `${partido.id}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error: err } = await supabase.storage
      .from("partidos")
      .upload(nombre, file);
    if (err) {
      setError("Error al subir foto");
      return;
    }
    const { data: urlData } = supabase.storage
      .from("partidos")
      .getPublicUrl(nombre);
    await supabase
      .from("fotos")
      .insert({ partido_id: partido.id, url: urlData.publicUrl });
    setMsg("Foto subida correctamente");
    cargar();
  }

  async function eliminarFoto(foto) {
    const nombre = foto.url.split("/").pop();
    await supabase.storage.from("partidos").remove([nombre]);
    await supabase.from("fotos").delete().eq("id", foto.id);
    cargar();
  }

  async function eliminarPartido() {
    if (
      !confirm(
        `¿Eliminar el partido vs ${nombreRivalPartido}? Esta acción no se puede deshacer.`,
      )
    )
      return;
    setError("");
    if (fotos.length > 0) {
      const nombres = fotos.map((f) => f.url.split("/").pop());
      await supabase.storage.from("partidos").remove(nombres);
      await supabase.from("fotos").delete().eq("partido_id", partido.id);
    }
    await supabase
      .from("convocatorias_partido")
      .delete()
      .eq("partido_id", partido.id);
    await supabase.from("cronicas").delete().eq("partido_id", partido.id);
    const { error: err } = await supabase
      .from("partidos")
      .delete()
      .eq("id", partido.id);
    if (err) {
      setError("Error al eliminar el partido: " + err.message);
      return;
    }
    onBack();
  }

  function toggleConvocado(jugadorId) {
    const s = stats[jugadorId] ?? {};
    const eraConvocado = s.convocado !== false;
    setStats((prev) => ({
      ...prev,
      [jugadorId]: {
        ...s,
        convocado: !eraConvocado,
        titular: eraConvocado ? false : s.titular,
      },
    }));
  }

  const convocados = jugadores.filter(
    (c) => stats[c.jugadores.id]?.convocado !== false,
  );
  const noConvocados = jugadores.filter(
    (c) => stats[c.jugadores.id]?.convocado === false,
  );
  const titulares = convocados.filter((c) => stats[c.jugadores.id]?.titular);
  const suplentes = convocados.filter((c) => !stats[c.jugadores.id]?.titular);
  const pFavActual = partido.es_local
    ? partido.puntos_favor
    : partido.puntos_contra;
  const pConActual = partido.es_local
    ? partido.puntos_contra
    : partido.puntos_favor;

  const SECCIONES = [
    "resultado",
    "estadísticas",
    "crónica",
    "fotos",
    "editar partido",
  ];
  const fechaFormateada = partido.fecha
    ? new Date(partido.fecha).toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "Sin fecha";

  if (cargando) return <p style={{ color: "var(--muted)" }}>Cargando...</p>;

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

      <h1 style={{ marginBottom: "4px" }}>
        {partido.es_local ? "vs" : "@"} {nombreRivalPartido}
      </h1>
      <p
        style={{
          color: "var(--muted)",
          fontSize: "14px",
          marginBottom: "24px",
        }}
      >
        {fechaFormateada} ·{" "}
        {partido.jornada
          ? `J${partido.jornada}`
          : (partido.ronda ?? "Amistoso")}{" "}
        · {partido.es_local ? "Local" : "Visitante"}
      </p>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        {SECCIONES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setSeccion(s);
              setMsg("");
              setError("");
            }}
            style={{
              padding: "7px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              textTransform: "capitalize",
              background: seccion === s ? "var(--naranja)" : "transparent",
              color: seccion === s ? "white" : "var(--muted)",
              border: seccion === s ? "none" : "1px solid var(--borde)",
            }}
          >
            {s}
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

      {/* ── Resultado ── */}
      {seccion === "resultado" && (
        <div
          className="card"
          style={{
            maxWidth: "400px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            {[
              ["puntos_local", labelLocal],
              ["puntos_visitante", labelVisitante],
            ].map(([campo, label]) => (
              <div key={campo}>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "block",
                    marginBottom: "6px",
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                  }}
                >
                  {label}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={resultado[campo]}
                  onChange={(e) =>
                    setResultado({
                      ...resultado,
                      [campo]: e.target.value.replace(/[^0-9]/g, ""),
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--borde)",
                    background: "var(--fondo)",
                    color: "var(--texto)",
                    fontSize: "22px",
                    fontWeight: 800,
                    textAlign: "center",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            ))}
          </div>
          <button
            onClick={guardarResultado}
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
            Guardar resultado
          </button>
        </div>
      )}

      {/* ── Estadísticas ── */}
      {seccion === "estadísticas" && (
        <div>
          <div
            style={{
              background: "#1e3a5f",
              borderRadius: "10px",
              padding: "16px 20px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{ fontSize: "13px", fontWeight: 700, color: "white" }}
              >
                {labelLocal} vs {labelVisitante}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.5)",
                  marginTop: "2px",
                }}
              >
                Click izq +1 · Click der −1 · En tiros: mitad izq = anotados,
                mitad der = intentados
              </div>
            </div>
            {partido.puntos_favor !== null && (
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      color: "#F97316",
                      opacity: pFavActual >= pConActual ? 1 : 0.35,
                    }}
                  >
                    {pFavActual}
                  </span>
                  <span
                    style={{ color: "rgba(255,255,255,0.3)", fontSize: "22px" }}
                  >
                    –
                  </span>
                  <span
                    style={{
                      color: "#F97316",
                      opacity: pConActual >= pFavActual ? 1 : 0.35,
                    }}
                  >
                    {pConActual}
                  </span>
                </div>
                <div
                  style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}
                >
                  {pFavActual > pConActual ? "Victoria" : "Derrota"}
                </div>
              </div>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
                minWidth: "900px",
              }}
            >
              <tbody>
                {titulares.length > 0 && (
                  <>
                    <CabeceraSeccion titulo="Titulares" />
                    {titulares.map((c) => (
                      <FilaJugador
                        key={c.jugadores.id}
                        c={c}
                        stats={stats}
                        setStats={setStats}
                        toggleConvocado={toggleConvocado}
                      />
                    ))}
                    <FilaTotales lista={titulares} stats={stats} />
                  </>
                )}
                {suplentes.length > 0 && (
                  <>
                    <CabeceraSeccion titulo="Suplentes" />
                    {suplentes.map((c) => (
                      <FilaJugador
                        key={c.jugadores.id}
                        c={c}
                        stats={stats}
                        setStats={setStats}
                        toggleConvocado={toggleConvocado}
                      />
                    ))}
                    <FilaTotales lista={suplentes} stats={stats} />
                  </>
                )}
              </tbody>
            </table>
          </div>

          {noConvocados.length > 0 && (
            <div
              style={{
                marginTop: "20px",
                padding: "14px 16px",
                background: "var(--fondo)",
                border: "1px solid var(--borde)",
                borderRadius: "10px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: ".06em",
                  marginBottom: "10px",
                }}
              >
                No convocadas
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {noConvocados.map((c) => (
                  <button
                    key={c.jugadores.id}
                    onClick={() => toggleConvocado(c.jugadores.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "5px 10px",
                      borderRadius: "20px",
                      border: "1px solid var(--borde)",
                      background: "transparent",
                      color: "var(--muted)",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>#{c.dorsal}</span>
                    {c.jugadores.nombre[0]}. {c.jugadores.apellido}
                    <span style={{ color: "var(--naranja)", fontWeight: 700 }}>
                      +
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(() => {
            const totalSegs = convocados.reduce(
              (a, c) =>
                a + minutosASegundos(stats[c.jugadores.id]?.minutos ?? "0"),
              0,
            );
            const OBJETIVO = 200 * 60;
            const totalTitulares = titulares.length;
            const minutosOk = totalSegs === OBJETIVO;
            const titularesOk = totalTitulares === 5;
            const todoOk = minutosOk && titularesOk;
            const diff = Math.abs(totalSegs - OBJETIVO);
            return (
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{ display: "flex", gap: "16px", alignItems: "center" }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      fontFamily: "monospace",
                      color: minutosOk
                        ? "green"
                        : totalSegs > OBJETIVO
                          ? "red"
                          : "var(--muted)",
                    }}
                  >
                    {segundosADisplay(totalSegs)} / 200:00
                    {!minutosOk && (
                      <span
                        style={{
                          fontWeight: 400,
                          marginLeft: "6px",
                          fontFamily: "system-ui",
                        }}
                      >
                        {totalSegs < OBJETIVO
                          ? `(faltan ${segundosADisplay(diff)})`
                          : `(sobran ${segundosADisplay(diff)})`}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: titularesOk
                        ? "green"
                        : totalTitulares > 5
                          ? "red"
                          : "var(--muted)",
                    }}
                  >
                    {totalTitulares} / 5 titulares
                    {!titularesOk && (
                      <span style={{ fontWeight: 400, marginLeft: "6px" }}>
                        {totalTitulares > 5
                          ? `(${totalTitulares - 5} de más)`
                          : `(faltan ${5 - totalTitulares})`}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const errores = [];
                    if (!minutosOk)
                      errores.push(
                        `Los minutos suman ${segundosADisplay(totalSegs)} en lugar de 200:00`,
                      );
                    if (!titularesOk)
                      errores.push(
                        `Hay ${totalTitulares} titulares en lugar de 5`,
                      );
                    if (
                      errores.length > 0 &&
                      !confirm(
                        `Atención:\n${errores.join("\n")}\n\n¿Guardar igualmente?`,
                      )
                    )
                      return;
                    await Promise.all(
                      convocados.map((c) => guardarStats(c.jugadores.id)),
                    );
                    setMsg("Estadísticas guardadas correctamente");
                  }}
                  style={{
                    background: todoOk ? "var(--naranja)" : "var(--azul)",
                    color: "white",
                    border: "none",
                    padding: "10px 24px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {todoOk ? "Guardar estadísticas" : "Guardar igualmente"}
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Crónica ── */}
      {seccion === "crónica" && (
        <div
          className="card"
          style={{
            maxWidth: "700px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <textarea
            value={cronica}
            onChange={(e) => setCronica(e.target.value)}
            placeholder="Escribe la crónica del partido..."
            rows={12}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--borde)",
              background: "var(--fondo)",
              color: "var(--texto)",
              fontSize: "14px",
              lineHeight: 1.7,
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => guardarCronica(false)}
              style={{
                background: "transparent",
                border: "1px solid var(--borde)",
                color: "var(--texto)",
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Guardar borrador
            </button>
            <button
              onClick={() => guardarCronica(true)}
              style={{
                background: "var(--naranja)",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Publicar
            </button>
          </div>
        </div>
      )}

      {/* ── Fotos ── */}
      {seccion === "fotos" && (
        <div>
          <div
            className="card"
            style={{ maxWidth: "400px", marginBottom: "20px" }}
          >
            <label
              style={{
                fontSize: "13px",
                fontWeight: 700,
                display: "block",
                marginBottom: "10px",
              }}
            >
              Subir foto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={subirFoto}
              style={{ fontSize: "13px", color: "var(--texto)" }}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
            }}
          >
            {fotos.map((f) => (
              <div
                key={f.id}
                style={{
                  position: "relative",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1px solid var(--borde)",
                }}
              >
                <img
                  src={f.url}
                  alt=""
                  style={{
                    width: "100%",
                    height: "140px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <button
                  onClick={() => eliminarFoto(f)}
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    background: "rgba(0,0,0,0.6)",
                    border: "none",
                    color: "white",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            {fotos.length === 0 && (
              <p style={{ color: "var(--muted)", gridColumn: "1/-1" }}>
                No hay fotos subidas.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Editar partido ── */}
      {seccion === "editar partido" && (
        <div>
          <p
            style={{
              fontSize: "13px",
              color: "var(--muted)",
              marginBottom: "20px",
            }}
          >
            Modifica los datos generales de este partido.
          </p>
          <FormPartido
            form={formEditar}
            setForm={setFormEditar}
            participantes={participantes}
            clubes={clubes}
            fases={fases}
            equipo={equipo}
            vista="editar"
            onGuardar={guardarEdicionPartido}
            onCancelar={() => setSeccion("resultado")}
          />

          <div
            style={{
              marginTop: "32px",
              padding: "16px",
              border: "1px solid #ef444440",
              borderRadius: "10px",
              background: "#ef444408",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#ef4444",
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: ".06em",
              }}
            >
              Zona peligrosa
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "var(--muted)",
                marginBottom: "12px",
              }}
            >
              Eliminar este partido borrará también todas sus estadísticas,
              crónica y fotos asociadas.
            </p>
            <button
              onClick={eliminarPartido}
              style={{
                background: "transparent",
                border: "1px solid #ef4444",
                color: "#ef4444",
                padding: "9px 20px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Eliminar partido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
