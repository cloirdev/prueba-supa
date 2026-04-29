import { useState, useEffect } from "react";

export default function AdminNoticias({
  supabase,
  perfil,
  equipo,
  temporada,
  onBack,
}) {
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState("lista");
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);
  const [form, setForm] = useState({
    titulo: "",
    subtitulo: "",
    contenido: "",
    publicada: false,
  });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    const { data } = await supabase
      .from("noticias")
      .select("*")
      .order("created_at", { ascending: false });
    setNoticias(data ?? []);
    setCargando(false);
  }

  function nuevaNoticia() {
    setNoticiaSeleccionada(null);
    setForm({ titulo: "", subtitulo: "", contenido: "", publicada: false });
    setMsg("");
    setError("");
    setVista("editar");
  }

  function editarNoticia(n) {
    setNoticiaSeleccionada(n);
    setForm({
      titulo: n.titulo,
      subtitulo: n.subtitulo ?? "",
      contenido: n.contenido ?? "",
      publicada: n.publicada,
    });
    setMsg("");
    setError("");
    setVista("editar");
  }

  async function guardar(publicada) {
    setError("");
    setMsg("");
    if (!form.titulo) {
      setError("El título es obligatorio");
      return;
    }

    const payload = {
      titulo: form.titulo,
      subtitulo: form.subtitulo,
      contenido: form.contenido,
      publicada,
      fecha: new Date().toISOString().split("T")[0],
    };

    if (noticiaSeleccionada) {
      const { error: err } = await supabase
        .from("noticias")
        .update(payload)
        .eq("id", noticiaSeleccionada.id);
      if (err) {
        setError("Error al guardar");
        return;
      }
    } else {
      const { error: err } = await supabase.from("noticias").insert(payload);
      if (err) {
        setError("Error al guardar");
        return;
      }
    }

    setMsg(publicada ? "Noticia publicada" : "Borrador guardado");
    cargar();
  }

  async function eliminarNoticia(id) {
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
            {equipo.nombre} · {temporada.nombre}
          </p>
        </div>
        {vista === "lista" && (
          <button onClick={nuevaNoticia} className="adm-btn-primary">
            + Nueva noticia
          </button>
        )}
        {vista === "editar" && (
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
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ flex: 1 }}>
                <div className="adm-card-title" style={{ marginBottom: "2px" }}>
                  {n.titulo}
                </div>
                <div className="adm-card-subtitle" style={{ marginTop: 0 }}>
                  {n.subtitulo}
                </div>
                <div style={{ marginTop: "6px" }}>
                  <span
                    className={`adm-pill ${n.publicada ? "adm-pill--success" : "adm-pill--muted"}`}
                  >
                    {n.publicada ? "Publicada" : "Borrador"}
                  </span>
                </div>
              </div>
              <div className="adm-actions">
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

      {vista === "editar" && (
        <div className="card adm-form-card">
          <div className="adm-field">
            <label className="adm-label">Título</label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Título de la noticia"
              className="adm-input"
            />
          </div>
          <div className="adm-field">
            <label className="adm-label">Subtítulo</label>
            <input
              type="text"
              value={form.subtitulo}
              onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
              placeholder="Subtítulo o entradilla"
              className="adm-input"
            />
          </div>
          <div className="adm-field">
            <label className="adm-label">Contenido</label>
            <textarea
              value={form.contenido}
              onChange={(e) => setForm({ ...form, contenido: e.target.value })}
              placeholder="Escribe el contenido de la noticia..."
              rows={10}
              className="adm-textarea"
            />
          </div>
          <div className="adm-row">
            <button
              onClick={() => guardar(false)}
              className="adm-btn-secondary"
            >
              Guardar borrador
            </button>
            <button onClick={() => guardar(true)} className="adm-btn-primary">
              Publicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
