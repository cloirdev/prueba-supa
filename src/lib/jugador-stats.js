// src/lib/jugador-stats.js
// Lógica pura (sin Supabase, sin DOM) usada por la ficha de jugador.

export const posicionLabel = {
  Base: "Base",
  Escolta: "Escolta",
  Alero: "Alero",
  "Ala-Pívot": "Ala-Pívot",
  Pívot: "Pívot",
};

export const genderoCategoriaLabel = {
  masculino: "Masculino",
  femenino: "Femenino",
  mixto: "Mixto",
};

export function porcentaje(an, intent) {
  if (!intent) return 0;
  return Math.round((an / intent) * 100);
}

export function nivelPct(pct) {
  if (pct >= 50) return "alto";
  if (pct >= 35) return "medio";
  return "bajo";
}

export function minutosDisplay(totalSegundos) {
  const val = parseInt(totalSegundos) || 0;
  if (val < 200) return `${val}'`;
  const mm = Math.floor(val / 60);
  const ss = val % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}

export function formatFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function nombreEquipoPropio(eq) {
  return eq?.sponsors?.nombre
    ? `${eq.sponsors.nombre}`
    : `CB Jaca ${eq?.categorias?.nombre ?? ""}`;
}

export function nombreCompeticion(eq) {
  return (
    eq?.equipo_competiciones?.[0]?.competiciones?.nombre ??
    eq?.categorias?.nombre ??
    "—"
  );
}

export function nombreRival(p) {
  const participanteRival = p?.es_local
    ? p?.participante_visitante
    : p?.participante_local;
  return (
    participanteRival?.nombre_equipo ??
    participanteRival?.equipos_rivales?.nombre_equipo ??
    "Rival"
  );
}

export function sum(arr, campo) {
  return arr.reduce((acc, s) => acc + (parseInt(s[campo]) || 0), 0);
}

export function normalizar(valor, max) {
  return Math.max(0, Math.min(1, (valor || 0) / max));
}

export function puntoEje(indice, total, cx, cy, radio, valor) {
  const angulo = (Math.PI * 2 * indice) / total - Math.PI / 2;
  const x = cx + Math.cos(angulo) * radio * valor;
  const y = cy + Math.sin(angulo) * radio * valor;
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}

export function poligonoRadar(valores, cx, cy, radio) {
  return valores
    .map((v, i) => puntoEje(i, valores.length, cx, cy, radio, v))
    .join(" ");
}

export function etiquetaEje(indice, total, cx, cy, radio) {
  const angulo = (Math.PI * 2 * indice) / total - Math.PI / 2;
  return {
    x: cx + Math.cos(angulo) * radio,
    y: cy + Math.sin(angulo) * radio,
  };
}

/**
 * Calcula todas las estadísticas derivadas de un conjunto de líneas de
 * `convocatorias_partido` (una temporada, o el total de la carrera).
 */
export function computarDatos(statsSeason) {
  const jugados = statsSeason.filter((s) => (s.minutos ?? 0) > 0).length;

  const totales = {
    puntos: sum(statsSeason, "puntos"),
    reb_of: sum(statsSeason, "rebotes_ofensivos"),
    reb_def: sum(statsSeason, "rebotes_defensivos"),
    asistencias: sum(statsSeason, "asistencias"),
    robos: sum(statsSeason, "robos"),
    tapones: sum(statsSeason, "tapones"),
    perdidas: sum(statsSeason, "perdidas"),
    valoracion: sum(statsSeason, "valoracion"),
    minutos: sum(statsSeason, "minutos"),
    tc_an: sum(statsSeason, "tiros_campo_anotados"),
    tc_int: sum(statsSeason, "tiros_campo_intentados"),
    t3_an: sum(statsSeason, "triples_anotados"),
    t3_int: sum(statsSeason, "triples_intentados"),
    tl_an: sum(statsSeason, "tiros_libres_anotados"),
    tl_int: sum(statsSeason, "tiros_libres_intentados"),
  };
  totales.rebotes = totales.reb_of + totales.reb_def;

  const media = (v) => (jugados ? v / jugados : 0);
  const mediaFmt = (v) => (jugados ? (v / jugados).toFixed(1) : "—");

  const medias = {
    puntos: media(totales.puntos),
    rebotes: media(totales.rebotes),
    asistencias: media(totales.asistencias),
    valoracion: media(totales.valoracion),
    defensa: media(totales.robos + totales.tapones),
  };

  const mediasFmt = {
    puntos: mediaFmt(totales.puntos),
    rebotes: mediaFmt(totales.rebotes),
    asistencias: mediaFmt(totales.asistencias),
    valoracion: mediaFmt(totales.valoracion),
    robos: mediaFmt(totales.robos),
    tapones: mediaFmt(totales.tapones),
  };

  let maxPuntos = null;
  let mejorTriples = null;
  let mejorValoracion = null;

  statsSeason.forEach((s) => {
    if (!maxPuntos || (s.puntos ?? 0) > (maxPuntos.puntos ?? 0)) maxPuntos = s;
    if (
      !mejorValoracion ||
      (s.valoracion ?? 0) > (mejorValoracion.valoracion ?? 0)
    )
      mejorValoracion = s;
    if ((s.triples_intentados ?? 0) >= 3) {
      const pct = s.triples_anotados / s.triples_intentados;
      const pctActual = mejorTriples
        ? mejorTriples.triples_anotados / mejorTriples.triples_intentados
        : -1;
      if (pct > pctActual) mejorTriples = s;
    }
  });

  const radar = [
    normalizar(medias.puntos, 22),
    normalizar(medias.rebotes, 12),
    normalizar(medias.asistencias, 7),
    normalizar(medias.defensa, 5),
    normalizar(medias.valoracion, 22),
  ];

  const idMejorPartido = mejorValoracion?.partidos?.id ?? null;

  const partidosOrdenados = [...statsSeason].sort(
    (a, b) =>
      new Date(b.partidos?.fecha ?? 0) - new Date(a.partidos?.fecha ?? 0),
  );

  return {
    jugados,
    totales,
    medias,
    mediasFmt,
    maxPuntos,
    mejorTriples,
    radar,
    idMejorPartido,
    partidos: partidosOrdenados,
  };
}
