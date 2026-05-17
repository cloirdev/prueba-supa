import { useState, useEffect } from "react";
import FormPartido from "./FormPartido.jsx";

// ── Helpers globales ───────────────────────────────────────────────────────
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

// ── Función de valoración reutilizable ────────────────────────────────────
function calcularValoracion(s) {
  const pts =
    parseInt(s.tiros_libres_anotados ?? 0) * 1 +
    parseInt(s.tiros_campo_anotados ?? 0) * 2 +
    parseInt(s.triples_anotados ?? 0) * 3;
  const rt =
    parseInt(s.rebotes_ofensivos ?? 0) + parseInt(s.rebotes_defensivos ?? 0);
  const tcAn =
    parseInt(s.tiros_campo_anotados ?? 0) + parseInt(s.triples_anotados ?? 0);
  const tcInt =
    parseInt(s.tiros_campo_intentados ?? 0) +
    parseInt(s.triples_intentados ?? 0);
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

// ── FilaJugador — FUERA del componente padre para evitar pérdida de foco ──
function FilaJugador({ c, stats, setStats, toggleConvocado }) {
  const s = stats[c.jugadores.id] ?? {};
  const esTitular = s.titular ?? false;

  // Puntos calculados automáticamente
  const ptsTotal =
    parseInt(s.tiros_libres_anotados ?? 0) * 1 +
    parseInt(s.tiros_campo_anotados ?? 0) * 2 +
    parseInt(s.triples_anotados ?? 0) * 3;

  // FG total (T2 + triples)
  const tcAnotados =
    parseInt(s.tiros_campo_anotados ?? 0) + parseInt(s.triples_anotados ?? 0);
  const tcIntentados =
    parseInt(s.tiros_campo_intentados ?? 0) +
    parseInt(s.triples_intentados ?? 0);

  // Rebotes totales
  const rt =
    parseInt(s.rebotes_ofensivos ?? 0) + parseInt(s.rebotes_defensivos ?? 0);

  // Valoración
  const val = calcularValoracion(s);

  function update(campo, val) {
    setStats((prev) => ({
      ...prev,
      [c.jugadores.id]: { ...prev[c.jugadores.id], [campo]: val },
    }));
  }

  const inputBase = {
    padding: "4px",
    borderRadius: "4px",
    border: "none",
    borderBottom: "1px solid var(--borde)",
    background: "transparent",
    color: "var(--texto)",
    fontSize: "13px",
    textAlign: "center",
  };

  const celda = (campo, width = "38px") => (
    <td style={{ padding: "6px 8px", textAlign: "center" }}>
      <input
        type="text"
        inputMode="numeric"
        value={s[campo] ?? ""}
        onChange={(e) => update(campo, e.target.value.replace(/[^0-9-]/g, ""))}
        style={{ ...inputBase, width }}
      />
    </td>
  );

  const celdaMinutos = () => (
    <td style={{ padding: "6px 8px", textAlign: "center" }}>
      <input
        type="text"
        inputMode="numeric"
        placeholder="00:00"
        value={s.minutos ?? ""}
        onChange={(e) => {
          const val = e.target.value.replace(/[^0-9:]/g, "").slice(0, 5);
          update("minutos", val);
        }}
        onBlur={(e) => {
          const raw = e.target.value;
          if (!raw) return;
          let normalizado;
          if (!raw.includes(":")) {
            const mins = parseInt(raw) || 0;
            normalizado = `${String(mins).padStart(2, "0")}:00`;
          } else {
            const [mm, ss] = raw.split(":");
            const mins = parseInt(mm) || 0;
            const secs = Math.min(parseInt(ss) || 0, 59);
            normalizado = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
          }
          update("minutos", normalizado);
        }}
        style={{ ...inputBase, width: "48px", fontFamily: "monospace" }}
      />
    </td>
  );

  const celdaTiro = (an, int_) => (
    <td style={{ padding: "6px 8px", textAlign: "center" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1px",
          justifyContent: "center",
        }}
      >
        {[an, int_].map((campo, i) => (
          <span key={campo} style={{ display: "flex", alignItems: "center" }}>
            {i === 1 && (
              <span
                style={{
                  color: "var(--muted)",
                  fontSize: "12px",
                  margin: "0 1px",
                }}
              >
                -
              </span>
            )}
            <input
              type="text"
              inputMode="numeric"
              value={s[campo] ?? ""}
              onChange={(e) =>
                update(campo, e.target.value.replace(/[^0-9]/g, ""))
              }
              style={{ ...inputBase, width: "26px", padding: "4px 2px" }}
            />
          </span>
        ))}
      </div>
    </td>
  );

  // FG calculado — solo lectura
  const celdaTCCalc = () => (
    <td style={{ padding: "6px 8px", textAlign: "center" }}>
      <div
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: "var(--muted)",
          fontFamily: "monospace",
          letterSpacing: "0.02em",
        }}
      >
        {tcAnotados}-{tcIntentados}
      </div>
    </td>
  );

  // PTS calculado — solo lectura
  const celdaPuntos = () => (
    <td
      style={{
        padding: "6px 8px",
        textAlign: "center",
        fontWeight: 800,
        fontSize: "14px",
        color: "var(--texto)",
      }}
    >
      {ptsTotal || "0"}
    </td>
  );

  // VAL calculado — solo lectura, con color
  const celdaVal = () => (
    <td
      style={{
        padding: "6px 8px",
        textAlign: "center",
        fontWeight: 800,
        fontSize: "13px",
        color: val > 0 ? "#0baa3b" : val < 0 ? "#ef4444" : "var(--muted)",
      }}
    >
      {val > 0 ? `+${val}` : val}
    </td>
  );

  return (
    <tr style={{ borderBottom: "0.5px solid var(--borde)" }}>
      {/* Nombre + titular */}
      <td style={{ padding: "10px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            onClick={() => update("titular", !esTitular)}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: esTitular ? "#1e3a5f" : "transparent",
              border: esTitular ? "none" : "1px solid var(--borde)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 800,
              color: esTitular ? "#F97316" : "var(--muted)",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            {c.dorsal}
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: "13px" }}>
              {c.jugadores.nombre[0]}. {c.jugadores.apellido}
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "var(--muted)",
                marginLeft: "6px",
              }}
            >
              {c.jugadores.posicion?.[0]}
            </span>
          </div>
        </div>
      </td>
      {celdaMinutos()}
      {celdaPuntos()}
      {celdaTCCalc()}
      {celdaTiro("tiros_campo_anotados", "tiros_campo_intentados")}
      {celdaTiro("triples_anotados", "triples_intentados")}
      {celdaTiro("tiros_libres_anotados", "tiros_libres_intentados")}
      {celda("rebotes_ofensivos", "36px")}
      {celda("rebotes_defensivos", "36px")}
      <td
        style={{
          padding: "6px 8px",
          textAlign: "center",
          fontWeight: 700,
          fontSize: "13px",
        }}
      >
        {rt || "0"}
      </td>
      {celda("asistencias", "36px")}
      {celda("robos", "36px")}
      {celda("perdidas", "36px")}
      {celda("tapones", "36px")}
      {celda("faltas_cometidas", "36px")}
      {celda("faltas_recibidas", "36px")}
      {celdaVal()}
      {/* +/- */}
      <td style={{ padding: "6px 8px", textAlign: "center" }}>
        <input
          type="text"
          inputMode="numeric"
          value={s.mas_menos ?? ""}
          onChange={(e) =>
            update("mas_menos", e.target.value.replace(/[^0-9-]/g, ""))
          }
          style={{
            ...inputBase,
            width: "36px",
            fontWeight: 700,
            color:
              parseInt(s.mas_menos ?? 0) > 0
                ? "#0baa3b"
                : parseInt(s.mas_menos ?? 0) < 0
                  ? "#ef4444"
                  : "var(--muted)",
          }}
        />
      </td>
      {/* Botón quitar */}
      <td style={{ padding: "6px 8px", textAlign: "center" }}>
        <button
          onClick={() => toggleConvocado(c.jugadores.id)}
          style={{
            background: "transparent",
            border: "1px solid var(--borde)",
            borderRadius: "6px",
            padding: "3px 8px",
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

// ── FilaTotales — también fuera ────────────────────────────────────────────
function FilaTotales({ lista, stats }) {
  const sum = (campo) =>
    lista.reduce(
      (a, c) => a + parseInt(stats[c.jugadores.id]?.[campo] ?? 0),
      0,
    );

  const sumMinutos = () => {
    const totalSegs = lista.reduce((a, c) => {
      return a + minutosASegundos(stats[c.jugadores.id]?.minutos ?? "0");
    }, 0);
    return segundosADisplay(totalSegs);
  };

  const sumPuntos = () =>
    lista.reduce((a, c) => {
      const s = stats[c.jugadores.id] ?? {};
      return (
        a +
        parseInt(s.tiros_libres_anotados ?? 0) * 1 +
        parseInt(s.tiros_campo_anotados ?? 0) * 2 +
        parseInt(s.triples_anotados ?? 0) * 3
      );
    }, 0);

  const sumVal = () =>
    lista.reduce(
      (a, c) => a + calcularValoracion(stats[c.jugadores.id] ?? {}),
      0,
    );

  const st = {
    padding: "8px",
    textAlign: "center",
    fontWeight: 700,
    fontSize: "12px",
    color: "var(--muted)",
  };

  const valTotal = sumVal();

  return (
    <tr
      style={{
        borderBottom: "2px solid var(--texto)",
        background: "var(--fondo)",
      }}
    >
      <td style={{ padding: "8px" }} />
      <td style={{ ...st, fontFamily: "monospace" }}>{sumMinutos()}</td>
      <td style={st}>{sumPuntos()}</td>
      <td style={st}>
        {sum("tiros_campo_anotados") + sum("triples_anotados")}-
        {sum("tiros_campo_intentados") + sum("triples_intentados")}
      </td>
      <td style={st}>
        {sum("tiros_campo_anotados")}-{sum("tiros_campo_intentados")}
      </td>
      <td style={st}>
        {sum("triples_anotados")}-{sum("triples_intentados")}
      </td>
      <td style={st}>
        {sum("tiros_libres_anotados")}-{sum("tiros_libres_intentados")}
      </td>
      <td style={st}>{sum("rebotes_ofensivos")}</td>
      <td style={st}>{sum("rebotes_defensivos")}</td>
      <td style={st}>{sum("rebotes_ofensivos") + sum("rebotes_defensivos")}</td>
      <td style={st}>{sum("asistencias")}</td>
      <td style={st}>{sum("robos")}</td>
      <td style={st}>{sum("perdidas")}</td>
      <td style={st}>{sum("tapones")}</td>
      <td style={st}>{sum("faltas_cometidas")}</td>
      <td style={st}>{sum("faltas_recibidas")}</td>
      <td
        style={{
          ...st,
          color:
            valTotal > 0
              ? "#0baa3b"
              : valTotal < 0
                ? "#ef4444"
                : "var(--muted)",
        }}
      >
        {valTotal > 0 ? `+${valTotal}` : valTotal}
      </td>
      <td />
      <td />
    </tr>
  );
}

// ── CabeceraSeccion — también fuera ───────────────────────────────────────
const HEADERS = [
  "MIN",
  "PTS",
  "FG",
  "T2",
  "3PT",
  "FT",
  "OREB",
  "DREB",
  "REB",
  "AST",
  "STL",
  "PER",
  "BLK",
  "PF",
  "FR",
  "VAL",
  "+/-",
  "",
];

function CabeceraSeccion({ titulo }) {
  return (
    <>
      <tr>
        <td
          colSpan={17}
          style={{
            padding: "16px 8px 6px",
            fontWeight: 800,
            fontSize: "11px",
            letterSpacing: ".1em",
            color: "var(--texto)",
            borderBottom: "2px solid var(--texto)",
          }}
        >
          {titulo}
        </td>
      </tr>
      <tr style={{ borderBottom: "0.5px solid var(--borde)" }}>
        <th
          style={{
            textAlign: "left",
            padding: "8px",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--muted)",
            minWidth: "160px",
          }}
        />
        {HEADERS.map((h) => (
          <th
            key={h}
            style={{
              padding: "8px",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--muted)",
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
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
  rivales = [],
  onBack,
}) {
  const [seccion, setSeccion] = useState("resultado");
  const [resultado, setResultado] = useState({
    puntos_local: partido.es_local
      ? (partido.puntos_favor ?? "")
      : (partido.puntos_contra ?? ""),
    puntos_visitante: partido.es_local
      ? (partido.puntos_contra ?? "")
      : (partido.puntos_favor ?? ""),
  });
  const [formEditar, setFormEditar] = useState({
    rival_id: partido.equipo_rival_id ?? "",
    tipo:
      partido.ronda === "Amistoso"
        ? "amistoso"
        : partido.ronda
          ? "playoff"
          : "liga",
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

  const nombreEquipo =
    equipo.sponsor ?? equipo.categorias?.nombre ?? "Nosotros";
  const nombreRivalPartido =
    partido.equipos_rivales?.nombre_equipo ?? partido.rival;
  const labelLocal = partido.es_local
    ? `${nombreEquipo} (local)`
    : `${nombreRivalPartido} (local)`;
  const labelVisitante = partido.es_local
    ? `${nombreRivalPartido} (visitante)`
    : `${nombreEquipo} (visitante)`;

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
      const segs = parseInt(s.minutos ?? 0);
      const minDisplay = segundosADisplay(segs);
      statsMap[s.jugador_id] = {
        ...statsMap[s.jugador_id],
        ...s,
        // Los inputs de T2 leen tiros_2_*, no tiros_campo_* (que es el FG total)
        tiros_campo_anotados: s.tiros_2_anotados ?? s.tiros_campo_anotados ?? 0,
        tiros_campo_intentados:
          s.tiros_2_intentados ?? s.tiros_campo_intentados ?? 0,
        minutos: minDisplay,
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
    if (!f.rival_id) {
      setError("Selecciona un rival");
      return;
    }
    if (f.tipo === "liga") {
      const j = Number.parseInt(f.jornada, 10);
      if (!f.jornada || Number.isNaN(j) || j < 1) {
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

    const rivalObj = rivales.find((r) => r.id === f.rival_id);
    const rivalNombre = rivalObj?.nombre_equipo ?? f.rival_id;
    const pLoc = parseInt(f.puntos_local) || 0;
    const pVis = parseInt(f.puntos_visitante) || 0;
    const { puntos_favor, puntos_contra } = f.disputado
      ? {
          puntos_favor: f.es_local ? pLoc : pVis,
          puntos_contra: f.es_local ? pVis : pLoc,
        }
      : { puntos_favor: null, puntos_contra: null };

    const { error: err } = await supabase
      .from("partidos")
      .update({
        equipo_rival_id: f.rival_id,
        rival: rivalNombre,
        fecha: f.fecha || null,
        es_local: f.es_local,
        puntos_favor,
        puntos_contra,
        jornada: f.tipo === "liga" ? parseInt(f.jornada) || null : null,
        ronda:
          f.tipo === "amistoso"
            ? "Amistoso"
            : f.tipo !== "liga"
              ? f.jornada || null
              : null,
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

    // Puntos calculados desde tiros
    const ptsTotal =
      parseInt(s.tiros_libres_anotados ?? 0) * 1 +
      parseInt(s.tiros_campo_anotados ?? 0) * 2 +
      parseInt(s.triples_anotados ?? 0) * 3;

    // FG total = T2 + triples
    const tcAnotados =
      parseInt(s.tiros_campo_anotados ?? 0) + parseInt(s.triples_anotados ?? 0);
    const tcIntentados =
      parseInt(s.tiros_campo_intentados ?? 0) +
      parseInt(s.triples_intentados ?? 0);

    // Rebotes totales
    const rebTotales =
      parseInt(s.rebotes_ofensivos ?? 0) + parseInt(s.rebotes_defensivos ?? 0);

    // Valoración
    const valoracion = calcularValoracion(s);

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
      tiros_campo_intentados: tcIntentados,
      tiros_campo_anotados: tcAnotados,
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
      valoracion,
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
                Boxscore ·{" "}
                {partido.jornada
                  ? `J${partido.jornada}`
                  : (partido.ronda ?? "Amistoso")}
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
                minWidth: "1000px",
              }}
            >
              <tbody>
                <CabeceraSeccion titulo="TITULARES" />
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
                <CabeceraSeccion titulo="SUPLENTES" />
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

                {/* Totales globales */}
                {(() => {
                  const sum = (campo) =>
                    convocados.reduce(
                      (a, c) =>
                        a + parseInt(stats[c.jugadores.id]?.[campo] ?? 0),
                      0,
                    );
                  const totalSegs = convocados.reduce(
                    (a, c) =>
                      a +
                      minutosASegundos(stats[c.jugadores.id]?.minutos ?? "0"),
                    0,
                  );
                  const totalPts = convocados.reduce((a, c) => {
                    const s = stats[c.jugadores.id] ?? {};
                    return (
                      a +
                      parseInt(s.tiros_libres_anotados ?? 0) * 1 +
                      parseInt(s.tiros_campo_anotados ?? 0) * 2 +
                      parseInt(s.triples_anotados ?? 0) * 3
                    );
                  }, 0);
                  const totalVal = convocados.reduce(
                    (a, c) =>
                      a + calcularValoracion(stats[c.jugadores.id] ?? {}),
                    0,
                  );
                  const st = {
                    padding: "10px 8px",
                    textAlign: "center",
                    fontWeight: 800,
                  };
                  return (
                    <tr style={{ borderTop: "2px solid var(--texto)" }}>
                      <td
                        style={{
                          padding: "10px 8px",
                          fontWeight: 800,
                          fontSize: "12px",
                          letterSpacing: ".08em",
                        }}
                      >
                        TOTALES
                      </td>
                      <td style={{ ...st, fontFamily: "monospace" }}>
                        {segundosADisplay(totalSegs)}
                      </td>
                      {/* PTS */}
                      <td style={{ ...st, color: "#F97316", fontSize: "15px" }}>
                        {totalPts}
                      </td>
                      {/* FG calculado */}
                      <td style={st}>
                        {sum("tiros_campo_anotados") + sum("triples_anotados")}-
                        {sum("tiros_campo_intentados") +
                          sum("triples_intentados")}
                      </td>
                      {/* T2 en bruto */}
                      <td style={st}>
                        {sum("tiros_campo_anotados")}-
                        {sum("tiros_campo_intentados")}
                      </td>
                      {/* 3PT */}
                      <td style={st}>
                        {sum("triples_anotados")}-{sum("triples_intentados")}
                      </td>
                      {/* FT */}
                      <td style={st}>
                        {sum("tiros_libres_anotados")}-
                        {sum("tiros_libres_intentados")}
                      </td>
                      {/* OREB */}
                      <td style={st}>{sum("rebotes_ofensivos")}</td>
                      {/* DREB */}
                      <td style={st}>{sum("rebotes_defensivos")}</td>
                      {/* REB total */}
                      <td style={st}>
                        {sum("rebotes_ofensivos") + sum("rebotes_defensivos")}
                      </td>
                      {/* AST */}
                      <td style={st}>{sum("asistencias")}</td>
                      {/* STL */}
                      <td style={st}>{sum("robos")}</td>
                      {/* PER */}
                      <td style={st}>{sum("perdidas")}</td>
                      {/* BLK */}
                      <td style={st}>{sum("tapones")}</td>
                      {/* PF */}
                      <td style={st}>{sum("faltas_cometidas")}</td>
                      {/* FR */}
                      <td style={st}>{sum("faltas_recibidas")}</td>
                      {/* VAL */}
                      <td
                        style={{
                          ...st,
                          color:
                            totalVal > 0
                              ? "#0baa3b"
                              : totalVal < 0
                                ? "#ef4444"
                                : "var(--muted)",
                        }}
                      >
                        {totalVal > 0 ? `+${totalVal}` : totalVal}
                      </td>
                      <td />
                    </tr>
                  );
                })()}
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
                No convocados
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

          {/* Contador minutos + guardar */}
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
            const diffDisplay = segundosADisplay(diff);

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
                  style={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "center",
                  }}
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
                          ? `(faltan ${diffDisplay})`
                          : `(sobran ${diffDisplay})`}
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
            rivales={rivales}
            equipo={equipo}
            vista="editar"
            onGuardar={guardarEdicionPartido}
            onCancelar={() => setSeccion("resultado")}
          />
        </div>
      )}
    </div>
  );
}
