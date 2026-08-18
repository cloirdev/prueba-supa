// src/lib/equipo-temporada.js
// Funciones puras (sin Supabase, sin DOM) usadas por la página de
// equipo/temporada y sus componentes.

export const posicionLabel = {
  base: "Base",
  escolta: "Escolta",
  alero: "Alero",
  ala_pivot: "Ala-Pívot",
  pivot: "Pívot",
};

export function nombreRival(p) {
  const rival = p.es_local ? p.participante_visitante : p.participante_local;
  return rival?.nombre_equipo ?? rival?.clubes?.nombre ?? "—";
}

export function escudoRival(p) {
  const rival = p.es_local ? p.participante_visitante : p.participante_local;
  return rival?.clubes?.logo_url ?? "/escudo.png";
}

export function formatFecha(fechaStr) {
  if (!fechaStr) return "Por confirmar";
  const [y, m, d] = fechaStr.split("-");
  const meses = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  const dias = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const fecha = new Date(fechaStr + "T00:00:00");
  return `${dias[fecha.getDay()]} ${d} ${meses[parseInt(m) - 1]}`;
}

export function etiquetaJornada(p) {
  if (p.jornada) return `J${p.jornada}`;
  if (p.ronda && p.ronda !== "Amistoso") return p.ronda;
  return "Amistoso";
}

export function fotoJugador(jugador, preferida = "accion") {
  const accionFields = [
    "foto_accion_url",
    "foto_dinamica_url",
    "foto_juego_url",
    "foto_url",
    "imagen_url",
  ];
  const seriaFields = ["foto_dni_url", "foto_seria_url", "foto_perfil_url"];
  const prioridad =
    preferida === "seria"
      ? [...seriaFields, ...accionFields]
      : [...accionFields, ...seriaFields];
  return prioridad.map((field) => jugador?.[field]).find(Boolean) ?? null;
}

export function competicionesDe(equipo) {
  return (equipo?.equipo_competiciones ?? [])
    .map((ec) => ec.competiciones)
    .filter(Boolean);
}

/** Diferencia de puntos (favor - contra) para una línea de clasificación. */
export function diferencia(c) {
  return (c?.puntos_favor ?? 0) - (c?.puntos_contra ?? 0);
}

/**
 * Combina los participantes de una fase con su fila de clasificación,
 * resuelve el nombre a mostrar (destacando al equipo propio) y ordena
 * por posición.
 */
export function calcularFilasClasificacion(
  participantes,
  clasificacion,
  equipoId,
  nombreEquipoPropio,
) {
  return (participantes ?? [])
    .map((p) => {
      const c = (clasificacion ?? []).find((c) => c.participante_id === p.id);
      const esMiEquipo = p.equipo_id === equipoId;
      const nombre = esMiEquipo
        ? nombreEquipoPropio
        : (p.nombre_equipo ?? p.clubes?.nombre ?? "—");
      return { p, c, nombre, esMiEquipo };
    })
    .sort((a, b) => (a.c?.posicion ?? 999) - (b.c?.posicion ?? 999));
}

/**
 * Agrupa las fases de una competición por su "orden" (nivel), para poder
 * renderizar la navegación de fases en niveles (p. ej. "Fase 1" / "Final").
 */
export function agruparFasesPorNivel(fases) {
  return (fases ?? []).reduce((acc, f) => {
    if (!acc[f.orden]) acc[f.orden] = [];
    acc[f.orden].push(f);
    return acc;
  }, {});
}
