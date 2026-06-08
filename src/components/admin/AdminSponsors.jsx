import { useState, useEffect, useRef } from "react";

export default function AdminSponsors({ supabase, perfil }) {
  const [sponsors, setSponsors] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null | "crear" | sponsor-obj (editar)
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    const { data } = await supabase
      .from("sponsors")
      .select("*")
      .order("nombre", { ascending: true });
    setSponsors(data ?? []);
    setCargando(false);
  }

  async function eliminar(sponsor) {
    if (
      !confirm(
        `¿Eliminar "${sponsor.nombre}"? Esta acción no se puede deshacer.`,
      )
    )
      return;
    setError("");
    setMsg("");

    // Borrar logo de storage si existe
    if (sponsor.logo_url) {
      const nombre = sponsor.logo_url.split("/").pop();
      await supabase.storage.from("sponsors").remove([nombre]);
    }

    const { error: err } = await supabase
      .from("sponsors")
      .delete()
      .eq("id", sponsor.id);
    if (err) {
      setError("Error al eliminar: " + err.message);
      return;
    }
    setMsg("Sponsor eliminado");
    cargar();
  }

  if (cargando) return <p style={{ color: "var(--muted)" }}>Cargando...</p>;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Sponsors</h1>
          <p
            style={{
              color: "var(--muted)",
              fontSize: "13px",
              marginTop: "4px",
            }}
          >
            {sponsors.length} sponsor{sponsors.length !== 1 ? "s" : ""}{" "}
            registrado{sponsors.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => {
            setMsg("");
            setError("");
            setModal("crear");
          }}
          style={{
            background: "var(--naranja)",
            color: "white",
            border: "none",
            padding: "9px 18px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + Nuevo sponsor
        </button>
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

      {sponsors.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "48px",
            color: "var(--muted)",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "12px" }}>🏷️</div>
          <p style={{ margin: 0 }}>No hay sponsors todavía.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "12px",
          }}
        >
          {sponsors.map((s) => (
            <div
              key={s.id}
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 16px",
              }}
            >
              {/* Logo */}
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  flexShrink: 0,
                  borderRadius: "10px",
                  overflow: "hidden",
                  background: "var(--color-background-secondary)",
                  border: "1px solid var(--borde)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {s.logo_url ? (
                  <img
                    src={s.logo_url}
                    alt={s.nombre}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      padding: "6px",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "1.4rem", opacity: 0.4 }}>🏷️</span>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "14px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.nombre}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--muted)",
                    marginTop: "2px",
                  }}
                >
                  {s.logo_url ? "Con logo" : "Sin logo"}
                </div>
              </div>

              {/* Acciones */}
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button
                  onClick={() => {
                    setMsg("");
                    setError("");
                    setModal(s);
                  }}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--borde)",
                    borderRadius: "6px",
                    padding: "5px 10px",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "var(--texto)",
                  }}
                >
                  ✏️
                </button>
                <button
                  onClick={() => eliminar(s)}
                  style={{
                    background: "transparent",
                    border: "1px solid #ef444440",
                    borderRadius: "6px",
                    padding: "5px 10px",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "#ef4444",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal crear / editar ── */}
      {modal !== null && (
        <ModalSponsor
          supabase={supabase}
          sponsor={modal === "crear" ? null : modal}
          onClose={() => setModal(null)}
          onGuardado={(msj) => {
            setMsg(msj);
            setModal(null);
            cargar();
          }}
          onError={setError}
        />
      )}
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────
function ModalSponsor({ supabase, sponsor, onClose, onGuardado, onError }) {
  const esEdicion = !!sponsor;
  const [nombre, setNombre] = useState(sponsor?.nombre ?? "");
  const [logoUrl, setLogoUrl] = useState(sponsor?.logo_url ?? "");
  const [preview, setPreview] = useState(sponsor?.logo_url ?? null);
  const [archivoNuevo, setArchivoNuevo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const inputFileRef = useRef();

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setArchivoNuevo(file);
    setPreview(URL.createObjectURL(file));
  }

  async function guardar() {
    onError("");
    if (!nombre.trim()) {
      onError("El nombre es obligatorio");
      return;
    }

    setSubiendo(true);
    let urlFinal = logoUrl;

    // Subir nuevo logo si se seleccionó
    if (archivoNuevo) {
      // Borrar logo anterior si existía
      if (sponsor?.logo_url) {
        const nombreAnterior = sponsor.logo_url.split("/").pop();
        await supabase.storage.from("sponsors").remove([nombreAnterior]);
      }

      const ext = archivoNuevo.name.split(".").pop();
      const nombreArchivo = `${Date.now()}-${nombre
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("sponsors")
        .upload(nombreArchivo, archivoNuevo, { upsert: true });

      if (uploadErr) {
        onError("Error al subir el logo: " + uploadErr.message);
        setSubiendo(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("sponsors")
        .getPublicUrl(nombreArchivo);
      urlFinal = urlData.publicUrl;
    }

    const payload = { nombre: nombre.trim(), logo_url: urlFinal || null };

    if (esEdicion) {
      const { error: err } = await supabase
        .from("sponsors")
        .update(payload)
        .eq("id", sponsor.id);
      if (err) {
        onError("Error al guardar: " + err.message);
        setSubiendo(false);
        return;
      }
      onGuardado("Sponsor actualizado correctamente");
    } else {
      const { error: err } = await supabase.from("sponsors").insert(payload);
      if (err) {
        onError("Error al crear: " + err.message);
        setSubiendo(false);
        return;
      }
      onGuardado("Sponsor creado correctamente");
    }
    setSubiendo(false);
  }

  async function eliminarLogo() {
    if (!sponsor?.logo_url) {
      setPreview(null);
      setArchivoNuevo(null);
      return;
    }
    const nombreArchivo = sponsor.logo_url.split("/").pop();
    await supabase.storage.from("sponsors").remove([nombreArchivo]);
    await supabase
      .from("sponsors")
      .update({ logo_url: null })
      .eq("id", sponsor.id);
    setPreview(null);
    setLogoUrl("");
    setArchivoNuevo(null);
  }

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "440px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "16px" }}>
            {esEdicion ? "Editar sponsor" : "Nuevo sponsor"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              color: "var(--muted)",
            }}
          >
            ✕
          </button>
        </div>

        {/* Nombre */}
        <div>
          <label
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: ".05em",
              display: "block",
              marginBottom: "6px",
            }}
          >
            Nombre *
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del sponsor"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid var(--borde)",
              background: "var(--fondo)",
              color: "var(--texto)",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Logo */}
        <div>
          <label
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: ".05em",
              display: "block",
              marginBottom: "10px",
            }}
          >
            Logo
          </label>

          {preview ? (
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  flexShrink: 0,
                  borderRadius: "10px",
                  border: "1px solid var(--borde)",
                  background: "var(--color-background-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    padding: "8px",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <button
                  onClick={() => inputFileRef.current?.click()}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--borde)",
                    borderRadius: "7px",
                    padding: "6px 14px",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "var(--texto)",
                    fontWeight: 600,
                  }}
                >
                  Cambiar imagen
                </button>
                <button
                  onClick={eliminarLogo}
                  style={{
                    background: "transparent",
                    border: "1px solid #ef444440",
                    borderRadius: "7px",
                    padding: "6px 14px",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "#ef4444",
                  }}
                >
                  Eliminar logo
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => inputFileRef.current?.click()}
              style={{
                border: "2px dashed var(--borde)",
                borderRadius: "10px",
                padding: "28px",
                textAlign: "center",
                cursor: "pointer",
                transition: "border-color .15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "var(--naranja)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "var(--borde)")
              }
            >
              <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>🖼️</div>
              <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                Haz clic para subir una imagen
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--muted)",
                  marginTop: "4px",
                  opacity: 0.6,
                }}
              >
                PNG, JPG, SVG, WEBP
              </div>
            </div>
          )}

          <input
            ref={inputFileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            style={{ display: "none" }}
          />
        </div>

        {/* Botones */}
        <div
          style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}
        >
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--borde)",
              color: "var(--texto)",
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={subiendo}
            style={{
              background: subiendo ? "var(--muted)" : "var(--naranja)",
              color: "white",
              border: "none",
              padding: "10px 24px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: subiendo ? "not-allowed" : "pointer",
            }}
          >
            {subiendo
              ? "Guardando..."
              : esEdicion
                ? "Guardar cambios"
                : "Crear sponsor"}
          </button>
        </div>
      </div>
    </div>
  );
}
