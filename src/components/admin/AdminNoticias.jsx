import { useState, useEffect } from "react";

function toSlug(titulo) {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function formatFecha(f) {
  if (!f) return "—";
  const [y, m, d] = f.split("T")[0].split("-");
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
  return `${parseInt(d)} ${meses[parseInt(m) - 1]} ${y}`;
}

export default function AdminNoticias({
  supabase,
  perfil,
  equipo,
  temporada,
  onBack,
}) {
  const [noticias, setNoticias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState("lista");
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);
  const [form, setForm] = useState(formInicial());
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  async function handleImagenFile(file) {
    if (!file) return;
    setSubiendoImagen(true);
    setError("");

    // Nombre único: timestamp + nombre original saneado
    const ext = file.name.split(".").pop();
    const nombreArchivo = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const ruta = `portadas/${nombreArchivo}`;

    const { error: uploadError } = await supabase.storage
      .from("noticias")
      .upload(ruta, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      setError("Error al subir la imagen: " + uploadError.message);
      setSubiendoImagen(false);
      return;
    }

    // Obtener URL pública
    const { data } = supabase.storage.from("noticias").getPublicUrl(ruta);
    setForm((f) => ({ ...f, img_url: data.publicUrl }));
    setSubiendoImagen(false);
  }

  function formInicial() {
    return {
      titulo: "",
      subtitulo: "",
      contenido: "",
      img_url: "",
      publicada: false,
      destacada: false,
      slug: "",
      categoria_id: equipo?.categoria_id ?? "",
    };
  }

  useEffect(() => {
    cargar();
    cargarCategorias();
  }, []);

  async function cargar() {
    const { data } = await supabase
      .from("noticias")
      .select("*, categorias(nombre)")
      .order("fecha_publicacion", { ascending: false, nullsFirst: false });
    setNoticias(data ?? []);
    setCargando(false);
  }

  async function cargarCategorias() {
    const { data } = await supabase
      .from("categorias")
      .select("id, nombre")
      .order("orden");
    setCategorias(data ?? []);
  }

  function nuevaNoticia() {
    setNoticiaSeleccionada(null);
    setForm(formInicial());
    setMsg("");
    setError("");
    setVista("editar");
  }

  function editarNoticia(n) {
    setNoticiaSeleccionada(n);
    setForm({
      titulo: n.titulo ?? "",
      subtitulo: n.subtitulo ?? "",
      contenido: n.contenido ?? "",
      img_url: n.img_url ?? "",
      publicada: n.publicada ?? false,
      destacada: n.destacada ?? false,
      slug: n.slug ?? toSlug(n.titulo ?? ""),
      categoria_id: n.categoria_id ?? "",
    });
    setMsg("");
    setError("");
    setVista("editar");
  }

  function handleTitulo(titulo) {
    setForm((f) => ({
      ...f,
      titulo,
      // Solo autogenerar slug si es nueva noticia o el slug estaba vacío
      slug: noticiaSeleccionada ? f.slug : toSlug(titulo),
    }));
  }

  async function guardar(publicada) {
    setError("");
    setMsg("");
    if (!form.titulo.trim()) {
      setError("El título es obligatorio");
      return;
    }
    if (!form.slug.trim()) {
      setError("El slug es obligatorio");
      return;
    }

    const ahora = new Date().toISOString();
    const esNueva = !noticiaSeleccionada;

    const payload = {
      titulo: form.titulo.trim(),
      subtitulo: form.subtitulo.trim() || null,
      contenido: form.contenido.trim() || null,
      img_url: form.img_url.trim() || null,
      publicada,
      destacada: form.destacada,
      slug: form.slug.trim(),
      categoria_id: form.categoria_id || null,
      // fecha_publicacion solo se pone al crear (o al publicar por primera vez)
      ...(esNueva && { fecha_publicacion: ahora }),
      ...(noticiaSeleccionada &&
        !noticiaSeleccionada.fecha_publicacion &&
        publicada && { fecha_publicacion: ahora }),
      fecha_actualizacion: ahora,
    };

    let err;
    if (noticiaSeleccionada) {
      ({ error: err } = await supabase
        .from("noticias")
        .update(payload)
        .eq("id", noticiaSeleccionada.id));
    } else {
      ({ error: err } = await supabase.from("noticias").insert(payload));
    }

    if (err) {
      setError(err.message ?? "Error al guardar");
      return;
    }
    setMsg(publicada ? "Noticia publicada ✓" : "Borrador guardado ✓");
    await cargar();
    setTimeout(() => {
      setVista("lista");
      setMsg("");
    }, 1200);
  }

  async function toggleDestacada(n) {
    await supabase
      .from("noticias")
      .update({ destacada: !n.destacada })
      .eq("id", n.id);
    cargar();
  }

  async function togglePublicada(n) {
    const update = {
      publicada: !n.publicada,
      fecha_actualizacion: new Date().toISOString(),
    };
    if (!n.publicada && !n.fecha_publicacion) {
      update.fecha_publicacion = new Date().toISOString();
    }
    await supabase.from("noticias").update(update).eq("id", n.id);
    cargar();
  }

  async function eliminarNoticia(id) {
    if (!confirm("¿Eliminar esta noticia?")) return;
    await supabase.from("noticias").delete().eq("id", id);
    cargar();
  }

  if (cargando)
    return <p style={{ color: "var(--muted)" }}>Cargando noticias...</p>;

  return (
    <div>
      <button onClick={onBack} className="adm-back-btn">
        ← Volver
      </button>

      <div className="adm-header">
        <div>
          <h1 className="adm-page-title">Noticias</h1>
          <p className="adm-page-subtitle">
            {equipo.sponsor ?? equipo.categorias?.nombre} · {temporada.nombre}
          </p>
        </div>
        {vista === "lista" ? (
          <button onClick={nuevaNoticia} className="adm-btn-primary">
            + Nueva noticia
          </button>
        ) : (
          <button
            onClick={() => {
              setVista("lista");
              setMsg("");
              setError("");
            }}
            className="adm-btn-secondary"
          >
            ← Volver a lista
          </button>
        )}
      </div>

      {msg && <p className="adm-msg-success">{msg}</p>}
      {error && <p className="adm-msg-error">{error}</p>}

      {/* ── Lista ── */}
      {vista === "lista" && (
        <div className="adm-list">
          {noticias.length === 0 && (
            <p className="adm-empty">
              No hay noticias todavía. Crea la primera.
            </p>
          )}
          {noticias.map((n) => (
            <div
              key={n.id}
              className="card"
              style={{ display: "flex", alignItems: "center", gap: "12px" }}
            >
              {/* Miniatura */}
              {n.img_url ? (
                <img
                  src={n.img_url}
                  alt=""
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "8px",
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "8px",
                    background: "var(--fondo)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    flexShrink: 0,
                  }}
                >
                  📰
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="adm-card-title" style={{ marginBottom: "2px" }}>
                  {n.titulo}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    alignItems: "center",
                    flexWrap: "wrap",
                    marginTop: "4px",
                  }}
                >
                  {n.categorias?.nombre && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: "4px",
                        background: "rgba(249,115,22,0.12)",
                        color: "var(--naranja, #F97316)",
                        textTransform: "uppercase",
                        letterSpacing: ".05em",
                      }}
                    >
                      {n.categorias.nombre}
                    </span>
                  )}
                  <span
                    className={`adm-pill ${n.publicada ? "adm-pill--success" : "adm-pill--muted"}`}
                  >
                    {n.publicada ? "Publicada" : "Borrador"}
                  </span>
                  {n.destacada && (
                    <span className="adm-pill adm-pill--active">
                      ⭐ Destacada
                    </span>
                  )}
                  <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                    {formatFecha(n.fecha_publicacion ?? n.created_at)}
                  </span>
                </div>
              </div>

              <div className="adm-actions" style={{ flexShrink: 0 }}>
                {/* Toggle destacada */}
                <button
                  onClick={() => toggleDestacada(n)}
                  className="adm-btn-secondary"
                  style={{ padding: "4px 10px", fontSize: "12px" }}
                  title={
                    n.destacada ? "Quitar de destacadas" : "Destacar en slider"
                  }
                >
                  {n.destacada ? "★" : "☆"}
                </button>
                {/* Toggle publicada */}
                <button
                  onClick={() => togglePublicada(n)}
                  className="adm-btn-secondary"
                  style={{ padding: "4px 10px", fontSize: "12px" }}
                >
                  {n.publicada ? "Despublicar" : "Publicar"}
                </button>
                <button
                  onClick={() => editarNoticia(n)}
                  className="adm-btn-secondary"
                >
                  Editar
                </button>
                {perfil?.rol === "admin" && (
                  <button
                    onClick={() => eliminarNoticia(n.id)}
                    className="adm-btn-danger"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Editor ── */}
      {vista === "editar" && (
        <div className="card adm-form-card">
          {/* Título + slug */}
          <div className="adm-field">
            <label className="adm-label">Título *</label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => handleTitulo(e.target.value)}
              placeholder="Título de la noticia"
              className="adm-input"
            />
          </div>

          <div className="adm-field">
            <label className="adm-label">
              Slug (URL){" "}
              <span
                style={{
                  fontWeight: 400,
                  textTransform: "none",
                  fontSize: "11px",
                  color: "var(--muted)",
                }}
              >
                — se genera automáticamente
              </span>
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                }))
              }
              placeholder="titulo-de-la-noticia"
              className="adm-input"
              style={{ fontFamily: "monospace", fontSize: "12px" }}
            />
            {form.slug && (
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--muted)",
                  marginTop: "2px",
                  display: "block",
                }}
              >
                URL: /noticias/…/{form.slug}
              </span>
            )}
          </div>

          <div className="adm-field">
            <label className="adm-label">Subtítulo / Entradilla</label>
            <input
              type="text"
              value={form.subtitulo}
              onChange={(e) =>
                setForm((f) => ({ ...f, subtitulo: e.target.value }))
              }
              placeholder="Resumen breve"
              className="adm-input"
            />
          </div>

          <div className="adm-field">
            <label className="adm-label">Contenido</label>
            <textarea
              value={form.contenido}
              onChange={(e) =>
                setForm((f) => ({ ...f, contenido: e.target.value }))
              }
              placeholder="Escribe el contenido de la noticia..."
              rows={10}
              className="adm-textarea"
            />
          </div>

          <div className="adm-field">
            <label className="adm-label">Imagen de portada</label>

            {/* Input archivo */}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImagenFile(e.target.files[0])}
              className="adm-input"
              style={{ padding: "6px" }}
            />

            {/* O pegar URL directamente */}
            <input
              type="text"
              value={form.img_url}
              onChange={(e) =>
                setForm((f) => ({ ...f, img_url: e.target.value }))
              }
              placeholder="O pega una URL externa: https://..."
              className="adm-input"
              style={{ marginTop: "6px" }}
            />

            {/* Preview */}
            {form.img_url && (
              <div
                style={{
                  marginTop: "8px",
                  position: "relative",
                  display: "inline-block",
                }}
              >
                <img
                  src={form.img_url}
                  alt=""
                  style={{
                    width: "100%",
                    maxHeight: "180px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                  onError={(e) => (e.target.style.display = "none")}
                />
                <button
                  onClick={() => setForm((f) => ({ ...f, img_url: "" }))}
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    background: "rgba(0,0,0,0.6)",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            {subiendoImagen && (
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  marginTop: "4px",
                }}
              >
                Subiendo imagen...
              </p>
            )}
          </div>

          {/* Categoría */}
          <div className="adm-field">
            <label className="adm-label">
              Categoría{" "}
              <span
                style={{
                  fontWeight: 400,
                  textTransform: "none",
                  fontSize: "11px",
                  color: "var(--muted)",
                }}
              >
                — déjalo vacío para noticias del club en general
              </span>
            </label>
            <select
              value={form.categoria_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, categoria_id: e.target.value }))
              }
              className="adm-input"
            >
              <option value="">Club en general</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Destacada */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              onClick={() =>
                setForm((f) => ({ ...f, destacada: !f.destacada }))
              }
              style={{
                width: "40px",
                height: "22px",
                borderRadius: "11px",
                background: form.destacada
                  ? "var(--naranja, #F97316)"
                  : "var(--borde)",
                position: "relative",
                cursor: "pointer",
                transition: "background .2s",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "3px",
                  left: form.destacada ? "21px" : "3px",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: "white",
                  transition: "left .2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                }}
              />
            </div>
            <span
              onClick={() =>
                setForm((f) => ({ ...f, destacada: !f.destacada }))
              }
              style={{
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              ⭐ Mostrar en el slider de portada
            </span>
          </div>

          {form.destacada && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: "rgba(249,115,22,0.08)",
                border: "0.5px solid rgba(249,115,22,0.2)",
                fontSize: "12px",
                color: "var(--muted)",
              }}
            >
              Esta noticia aparecerá en el slider de la página de inicio. Se
              muestran un máximo de 5 destacadas, ordenadas por fecha.
            </div>
          )}

          {/* Fechas (solo informativo si es edición) */}
          {noticiaSeleccionada && (
            <div
              style={{
                fontSize: "11px",
                color: "var(--muted)",
                display: "flex",
                gap: "16px",
              }}
            >
              {noticiaSeleccionada.fecha_publicacion && (
                <span>
                  Publicado:{" "}
                  {formatFecha(noticiaSeleccionada.fecha_publicacion)}
                </span>
              )}
              {noticiaSeleccionada.fecha_actualizacion && (
                <span>
                  Actualizado:{" "}
                  {formatFecha(noticiaSeleccionada.fecha_actualizacion)}
                </span>
              )}
            </div>
          )}

          <div className="adm-row">
            <button
              onClick={() => guardar(false)}
              className="adm-btn-secondary"
              disabled={subiendoImagen}
            >
              Guardar borrador
            </button>
            <button
              onClick={() => guardar(true)}
              className="adm-btn-primary"
              disabled={subiendoImagen}
            >
              {form.publicada ? "Guardar cambios" : "Publicar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
