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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ marginBottom: "4px" }}>Noticias</h1>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>
            {equipo.nombre} · {temporada.temporadas.nombre}
          </p>
        </div>
        {vista === "lista" && (
          <button
            onClick={nuevaNoticia}
            style={{
              background: "var(--naranja)",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
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
            style={{
              background: "transparent",
              border: "1px solid var(--borde)",
              color: "var(--muted)",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            ← Volver a lista
          </button>
        )}
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

      {vista === "lista" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {noticias.length === 0 && (
            <p style={{ color: "var(--muted)" }}>
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
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "14px",
                    marginBottom: "2px",
                  }}
                >
                  {n.titulo}
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                  {n.subtitulo}
                </div>
                <div style={{ marginTop: "6px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "2px 8px",
                      borderRadius: "20px",
                      fontWeight: 700,
                      background: n.publicada
                        ? "#f0fdf4"
                        : "var(--color-background-secondary)",
                      color: n.publicada ? "#166534" : "var(--muted)",
                    }}
                  >
                    {n.publicada ? "Publicada" : "Borrador"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginLeft: "16px" }}>
                <button
                  onClick={() => editarNoticia(n)}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--borde)",
                    color: "var(--texto)",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Editar
                </button>
                {perfil?.rol === "admin" && (
                  <button
                    onClick={() => eliminarNoticia(n.id)}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--borde)",
                      color: "red",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
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
        <div
          className="card"
          style={{
            maxWidth: "700px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div>
            <label
              style={{
                fontSize: "13px",
                fontWeight: 700,
                display: "block",
                marginBottom: "6px",
              }}
            >
              Título
            </label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Título de la noticia"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--borde)",
                background: "var(--fondo)",
                color: "var(--texto)",
                fontSize: "14px",
              }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: "13px",
                fontWeight: 700,
                display: "block",
                marginBottom: "6px",
              }}
            >
              Subtítulo
            </label>
            <input
              type="text"
              value={form.subtitulo}
              onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
              placeholder="Subtítulo o entradilla"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--borde)",
                background: "var(--fondo)",
                color: "var(--texto)",
                fontSize: "14px",
              }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: "13px",
                fontWeight: 700,
                display: "block",
                marginBottom: "6px",
              }}
            >
              Contenido
            </label>
            <textarea
              value={form.contenido}
              onChange={(e) => setForm({ ...form, contenido: e.target.value })}
              placeholder="Escribe el contenido de la noticia..."
              rows={10}
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
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => guardar(false)}
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
              onClick={() => guardar(true)}
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
    </div>
  );
}
