import { useState, useRef } from "react";

export default function AdminPanel({
  supabase,
  perfil,
  equipo,
  temporada,
  onBack,
  onIrA,
}) {
  const [fotoUrl, setFotoUrl] = useState(equipo.foto_url ?? null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [borrandoFoto, setBorrandoFoto] = useState(false);
  const [fotoError, setFotoError] = useState("");
  const inputFotoRef = useRef(null);

  const nombreEquipo = equipo.sponsor
    ? `${equipo.sponsor} CB Jaca`
    : `CB Jaca ${equipo.categorias?.nombre ?? ""}`;

  async function onFotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoError("");
    setSubiendoFoto(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${equipo.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("equipos")
        .upload(path, file, { upsert: true });
      if (uploadError) throw new Error(uploadError.message);
      const { data } = supabase.storage.from("equipos").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      await supabase
        .from("equipos")
        .update({ foto_url: data.publicUrl })
        .eq("id", equipo.id);
      setFotoUrl(publicUrl);
    } catch (e) {
      setFotoError(e.message);
    } finally {
      setSubiendoFoto(false);
      if (inputFotoRef.current) inputFotoRef.current.value = "";
    }
  }

  async function borrarFoto() {
    if (!confirm("¿Borrar la foto del equipo?")) return;
    setBorrandoFoto(true);
    setFotoError("");
    try {
      await supabase
        .from("equipos")
        .update({ foto_url: null })
        .eq("id", equipo.id);
      setFotoUrl(null);
    } catch (e) {
      setFotoError(e.message);
    } finally {
      setBorrandoFoto(false);
    }
  }

  return (
    <div>
      <button onClick={onBack} className="adm-back-btn">
        ← Volver
      </button>

      <h1 className="adm-page-title">{nombreEquipo}</h1>
      <p className="adm-page-subtitle">
        {equipo.competiciones?.nombre ?? temporada.nombre} · {temporada.nombre}
      </p>

      {/* ── Foto ── */}
      <div style={{ marginBottom: "32px", maxWidth: "520px" }}>
        <div className="adm-section-label" style={{ marginBottom: "10px" }}>
          Foto del equipo
        </div>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {fotoUrl ? (
            <div style={{ position: "relative" }}>
              <img
                src={fotoUrl}
                alt="Foto del equipo"
                style={{
                  width: "100%",
                  height: "180px",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "10px",
                  right: "10px",
                  display: "flex",
                  gap: "8px",
                }}
              >
                <button
                  onClick={() => inputFotoRef.current?.click()}
                  disabled={subiendoFoto}
                  style={btnFotoStyle}
                >
                  {subiendoFoto ? "Subiendo..." : "↑ Cambiar"}
                </button>
                <button
                  onClick={borrarFoto}
                  disabled={borrandoFoto}
                  style={{
                    ...btnFotoStyle,
                    borderColor: "rgba(255,99,99,0.5)",
                    color: "#fca5a5",
                  }}
                >
                  {borrandoFoto ? "..." : "✕ Borrar"}
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => !subiendoFoto && inputFotoRef.current?.click()}
              style={{
                height: "130px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: subiendoFoto ? "not-allowed" : "pointer",
                opacity: subiendoFoto ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: "28px" }}>🖼️</span>
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--muted)",
                  fontWeight: 600,
                }}
              >
                {subiendoFoto
                  ? "Subiendo foto..."
                  : "Sin foto · haz clic para subir"}
              </span>
              <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                JPG, PNG o WEBP · recomendado 1200×600 px
              </span>
            </div>
          )}
        </div>
        {fotoError && (
          <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "6px" }}>
            {fotoError}
          </p>
        )}
        <input
          ref={inputFotoRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFotoChange}
          style={{ display: "none" }}
        />
      </div>

      {/* ── Secciones ── */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {[
          {
            key: "plantilla",
            emoji: "👥",
            label: "Plantilla",
            sub: "Gestionar jugadores",
          },
          {
            key: "calendario",
            emoji: "📅",
            label: "Calendario",
            sub: "Partidos y resultados",
          },
          {
            key: "clasificacion",
            emoji: "🏆",
            label: "Clasificación",
            sub: "Tabla de la competición",
          },
          {
            key: "noticias",
            emoji: "📰",
            label: "Noticias",
            sub: "Crónicas y noticias",
          },
        ].map(({ key, emoji, label, sub }) => (
          <div
            key={key}
            onClick={() => onIrA(key)}
            className="card"
            style={{
              flex: "1 1 140px",
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "10px" }}>
              {emoji}
            </div>
            <div
              style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}
            >
              {label}
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>{sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const btnFotoStyle = {
  fontSize: "12px",
  fontWeight: 600,
  padding: "5px 12px",
  borderRadius: "6px",
  border: "0.5px solid rgba(255,255,255,0.35)",
  background: "rgba(0,0,0,0.45)",
  color: "white",
  cursor: "pointer",
};
