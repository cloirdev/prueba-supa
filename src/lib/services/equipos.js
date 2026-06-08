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
    categorias (nombre, slug),
    temporadas (nombre)
  `);

  if (error || !equipos) {
    console.error("❌ Error en Supabase:", error);
    return [];
  }

  const rutasMap = new Map();

  equipos.forEach((e) => {
    const cSlug = e.categorias?.slug;
    const tNombre = e.temporadas?.nombre;
    if (!cSlug || !tNombre) return;
    const key = `${cSlug}/${tNombre}`;
    if (!rutasMap.has(key)) {
      rutasMap.set(key, {
        params: { categoria_slug: cSlug, temporada_slug: tNombre },
        props: {
          equipoIds: [e.id],
          categoriaNombre: e.categorias.nombre,
          categoriaSlug: cSlug,
          temporadaNombre: tNombre,
          temporadaSlug: tNombre,
        },
      });
    } else {
      rutasMap.get(key).props.equipoIds.push(e.id);
    }
  });

  return Array.from(rutasMap.values());
}

export async function getEquipoTemporadaPageData(equipoIds = []) {
  const { data: equipos } = await supabase
    .from("equipos")
    .select(`
      *,
      categorias(nombre, slug),
      temporadas(nombre, id),
      competiciones(nombre, id),
      sponsors(id, nombre, logo_url)
    `)
    .in("id", equipoIds);

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
    .select(`
      id, es_local, fecha, jornada, ronda, puntos_favor, puntos_contra, equipo_id,
      participante_local:participantes!participante_local_id (
        id, nombre_equipo, clubes(nombre, logo_url)
      ),
      participante_visitante:participantes!participante_visitante_id (
        id, nombre_equipo, clubes(nombre, logo_url)
      )
    `)
    .in("equipo_id", equipoIds)
    .order("fecha", { ascending: true });

  const partidosPorEquipo = groupByEquipoId(partidos ?? []);

  const competicionIds = [
    ...new Set((equipos ?? []).map((e) => e.competiciones?.id).filter(Boolean)),
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
        const fasesEquipo = (fases ?? []).filter(
          (f) => f.competicion_id === e.competiciones?.id,
        );
        fasesPorEquipo.set(e.id, fasesEquipo);
      });

      const faseIds = fases.map((f) => f.id);

      const { data: participantes } = await supabase
        .from("participantes")
        .select("id, fase_id, equipo_id, nombre_equipo, clubes(nombre, logo_url)")
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
    .select(`id, temporadas(nombre)`)
    .eq("categoria_id", equipos?.[0]?.categoria_id);

  const temporadasOrdenadas = (otrasTemporadas ?? [])
    .filter((e) => e.temporadas?.nombre)
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
