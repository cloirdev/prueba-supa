// src/lib/searchIndex.js
import { createClient } from "@supabase/supabase-js";

export async function buildSearchIndex() {
  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  );

  const [{ data: jugadores }, { data: equipos }, { data: noticias }] =
    await Promise.all([
      supabase
        .from("jugadores")
        .select("id, nombre, apellido, foto_accion_url"),
      supabase.from("equipos").select(`
          id, sponsor,
          categorias(nombre, slug),
          temporadas(nombre, slug)
        `),
      supabase
        .from("noticias")
        .select("id, titulo, slug, fecha_publicacion, img_url")
        .eq("publicada", true),
    ]);

  const items = [
    ...(jugadores ?? []).map((j) => ({
      tipo: "jugador",
      id: j.id,
      titulo: `${j.nombre} ${j.apellido}`,
      imagen: j.foto_accion_url ?? null,
      subtitulo: "",
      url: `/jugadores/${j.id}`,
    })),
    ...(equipos ?? []).map((e) => ({
      tipo: "equipo",
      id: e.id,
      titulo: e.sponsor ?? e.categorias?.nombre ?? "Equipo",
      imagen: null,
      subtitulo: e.temporadas?.nombre ?? "",
      url: `/equipos/${e.categorias?.slug}/${e.temporadas?.slug}`,
    })),
    ...(noticias ?? []).map((n) => {
      const d = new Date(n.fecha_publicacion);
      return {
        tipo: "noticia",
        id: n.id,
        titulo: n.titulo,
        imagen: n.img_url ?? null,
        subtitulo: d.toLocaleDateString("es-ES", { dateStyle: "long" }),
        url: `/noticias/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`,
      };
    }),
  ];

  return items;
}
