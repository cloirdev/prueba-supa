import { supabase } from "@/lib/supabase.js";

function groupByEquipoId(rows = []) {
  const map = new Map();
  rows.forEach((row) => {
    if (!map.has(row.equipo_id)) map.set(row.equipo_id, []);
    map.get(row.equipo_id).push(row);
  });
  return map;
}

export async function getEquipoTemporadaStaticPaths() {
  const { data: equipos, error } = await supabase.from("equipos").select(`
    id,
    created_at,
    categorias (nombre, slug),
    temporadas:temporadas!equipos_temporada_id_fkey (nombre)
  `);

  if (error || !equipos) {
    console.error("❌ Error en Supabase:", error);
    return [];
  }

  const slugMap = resolverSlugsEquipos(equipos);

  return equipos
    .filter((e) => e.categorias?.slug && e.temporadas?.nombre)
    .map((e) => ({
      params: {
        categoria_slug: slugMap.get(e.id),
        temporada_slug: e.temporadas.nombre,
      },
      props: {
        equipoIds: [e.id], // ya no se fusiona, un equipo = una página
        categoriaNombre: e.categorias.nombre,
        categoriaSlug: slugMap.get(e.id),
        temporadaNombre: e.temporadas.nombre,
        temporadaSlug: e.temporadas.nombre,
      },
    }));
}

export async function getEquipoTemporadaPageData(
  equipoIds = [],
  categoriaSlug,
) {
  const { data: equipos, error: errEquipos } = await supabase
    .from("equipos")
    .select(
      `
      *,
      categorias(nombre, slug),
      temporadas:temporadas!equipos_temporada_id_fkey(nombre, id),
      sponsors:sponsors!equipos_sponsor_id_fkey(id, nombre, logo_url),
      equipo_competiciones(
        competiciones(id, nombre)
      )
    `,
    )
    .in("id", equipoIds);

  if (errEquipos) {
    console.error("❌ Error cargando equipos:", errEquipos);
  }

  // Helper: primera competición asociada a un equipo (o null)
  function competicionDe(equipo) {
    return equipo?.equipo_competiciones?.[0]?.competiciones ?? null;
  }

  const { data: convocatorias } = await supabase
    .from("convocatorias_temporada")
    .select(`dorsal, equipo_id, jugadores(*)`)
    .in("equipo_id", equipoIds)
    .order("dorsal", { ascending: true });

  const jugadoresPorEquipo = groupByEquipoId(convocatorias ?? []);

  const temporadaId = equipos?.[0]?.temporadas?.id;
  const { data: convocatoriasEntrenador } = await supabase
    .from("convocatorias_entrenador")
    .select(`rol, equipo_id, entrenadores(id, nombre, apellido)`)
    .in("equipo_id", equipoIds)
    .eq("temporada_id", temporadaId);

  const entrenadoresPorEquipo = groupByEquipoId(convocatoriasEntrenador ?? []);

  const { data: partidos } = await supabase
    .from("partidos")
    .select(
      `
      id, es_local, fecha, jornada, ronda, puntos_favor, puntos_contra, equipo_id,
      participante_local:participantes!participante_local_id (
        id, nombre_equipo, clubes(nombre, logo_url)
      ),
      participante_visitante:participantes!participante_visitante_id (
        id, nombre_equipo, clubes(nombre, logo_url)
      )
    `,
    )
    .in("equipo_id", equipoIds)
    .order("fecha", { ascending: true });

  const partidosPorEquipo = groupByEquipoId(partidos ?? []);

  // IDs de todas las competiciones de todos los equipos (vía tabla puente)
  const competicionIds = [
    ...new Set(
      (equipos ?? [])
        .flatMap((e) =>
          (e.equipo_competiciones ?? []).map((ec) => ec.competiciones?.id),
        )
        .filter(Boolean),
    ),
  ];

  let fasesPorEquipo = new Map();
  let participantesPorFase = new Map();
  let clasificacionPorFase = new Map();

  if (competicionIds.length > 0 && temporadaId) {
    const { data: fases } = await supabase
      .from("fases_competicion")
      .select("*")
      .in("competicion_id", competicionIds)
      .eq("temporada_id", temporadaId)
      .order("orden", { ascending: true });

    if (fases?.length) {
      (equipos ?? []).forEach((e) => {
        const idsCompeticionesEquipo = (e.equipo_competiciones ?? [])
          .map((ec) => ec.competiciones?.id)
          .filter(Boolean);
        const fasesEquipo = (fases ?? []).filter((f) =>
          idsCompeticionesEquipo.includes(f.competicion_id),
        );
        fasesPorEquipo.set(e.id, fasesEquipo);
      });

      const faseIds = fases.map((f) => f.id);

      const { data: participantes } = await supabase
        .from("participantes")
        .select(
          "id, fase_id, equipo_id, nombre_equipo, clubes(nombre, logo_url)",
        )
        .in("fase_id", faseIds);

      const { data: clasificacion } = await supabase
        .from("clasificacion")
        .select("*")
        .in("fase_id", faseIds);

      faseIds.forEach((fid) => {
        participantesPorFase.set(
          fid,
          (participantes ?? []).filter((p) => p.fase_id === fid),
        );
        clasificacionPorFase.set(
          fid,
          (clasificacion ?? []).filter((c) => c.fase_id === fid),
        );
      });
    }
  }

  const { data: otrasTemporadas } = await supabase
    .from("equipos")
    .select(
      `id, created_at, temporadas:temporadas!equipos_temporada_id_fkey(id, nombre), categorias(slug)`,
    )
    .eq("categoria_id", equipos?.[0]?.categoria_id);

  const slugMapOtras = resolverSlugsEquipos(otrasTemporadas ?? []);

  const temporadasOrdenadas = (otrasTemporadas ?? [])
    .filter(
      (e) => e.temporadas?.nombre && slugMapOtras.get(e.id) === categoriaSlug,
    )
    .map((e) => ({ nombre: e.temporadas.nombre, slug: e.temporadas.nombre }))
    .sort((a, b) => b.nombre.localeCompare(a.nombre))
    .filter((t, i, arr) => arr.findIndex((x) => x.slug === t.slug) === i);

  return {
    equipos,
    jugadoresPorEquipo,
    entrenadoresPorEquipo,
    partidosPorEquipo,
    fasesPorEquipo,
    participantesPorFase,
    clasificacionPorFase,
    temporadasOrdenadas,
  };
}

// Agrupa equipos por categoría+temporada y devuelve un Map
// equipo.id -> slug final de categoría (con sufijo si hay colisión)
export function resolverSlugsEquipos(equipos = []) {
  const grupos = new Map(); // key: "catSlug|tempNombre" -> [equipo, ...]

  equipos.forEach((e) => {
    const catSlug = e.categorias?.slug;
    const tempNombre = e.temporadas?.nombre;
    if (!catSlug || !tempNombre) return;
    const key = `${catSlug}|${tempNombre}`;
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key).push(e);
  });

  const slugMap = new Map(); // equipo.id -> slug final
  const sufijos = "bcdefghijk"; // hasta 11 equipos duplicados, de sobra

  grupos.forEach((lista) => {
    lista.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    lista.forEach((equipo, idx) => {
      const base = equipo.categorias.slug;
      const slugFinal = idx === 0 ? base : `${base}-${sufijos[idx - 1]}`;
      slugMap.set(equipo.id, slugFinal);
    });
  });

  return slugMap;
}
