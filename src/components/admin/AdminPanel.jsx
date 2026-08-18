import { useState, useRef, useEffect } from "react";
import AdminEquipoCompeticiones from "./AdminEquipoCompeticiones.jsx";

export default function AdminPanel({
  supabase,
  perfil,
  equipo,
  temporada,
  onBack,
  onIrA,
  onSponsorGuardado,
}) {
  const [fotoUrl, setFotoUrl] = useState(equipo.foto_url ?? null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [borrandoFoto, setBorrandoFoto] = useState(false);
  const [fotoError, setFotoError] = useState("");
  const inputFotoRef = useRef(null);
  const [sponsors, setSponsors] = useState([]);
  const [sponsorId, setSponsorId] = useState(equipo.sponsor_id ?? "");
  const [guardandoSponsor, setGuardandoSponsor] = useState(false);
  const [sponsorMsg, setSponsorMsg] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [eliminarError, setEliminarError] = useState("");

  useEffect(() => {
    supabase
      .from("sponsors")
      .select("id, nombre, logo_url")
      .order("nombre")
      .then(({ data }) => setSponsors(data ?? []));
  }, []);

  async function guardarSponsor() {
    setGuardandoSponsor(true);
    setSponsorMsg("");

    const sponsorSeleccionado = sponsors.find((s) => s.id === sponsorId);
    const nuevoNombre = sponsorSeleccionado?.nombre
      ? `${sponsorSeleccionado.nombre} CB Jaca`
      : `CB Jaca ${equipo.categorias?.nombre ?? ""}`.trim();

    await Promise.all([
      supabase
        .from("equipos")
        .update({ sponsor_id: sponsorId || null })
        .eq("id", equipo.id),
      supabase
        .from("participantes")
        .update({ nombre_equipo: nuevoNombre })
        .eq("equipo_id", equipo.id),
    ]);

    const { data: equipoActualizado } = await supabase
      .from("equipos")
      .select(
        "*, categorias(nombre), sponsors(id, nombre, logo_url), equipo_competiciones(competicion_id)",
      )
      .eq("id", equipo.id)
      .single();

    if (equipoActualizado && onSponsorGuardado)
      onSponsorGuardado(equipoActualizado);

    setSponsorMsg("Guardado ✓");
    setGuardandoSponsor(false);
    setTimeout(() => setSponsorMsg(""), 2000);
  }

  const sponsorActual = sponsors.find((s) => s.id === sponsorId);
  const nombreEquipo = sponsorActual?.nombre
    ? `${sponsorActual.nombre} CB Jaca`
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

  async function eliminarEquipo() {
    if (
      !confirm(
        `¿Seguro que quieres eliminar "${nombreEquipo}"?\n\nEsta acción no se puede deshacer.`,
      )
    )
      return;

    setEliminando(true);
    setEliminarError("");
    try {
      // 1. Borrar relaciones "seguras" primero
      await supabase
        .from("convocatorias_temporada")
        .delete()
        .eq("equipo_id", equipo.id);
      await supabase
        .from("convocatorias_entrenador")
        .delete()
        .eq("equipo_id", equipo.id);
      await supabase
        .from("equipo_competiciones")
        .delete()
        .eq("equipo_id", equipo.id);

      // 2. Borrar la foto del storage si existe
      if (fotoUrl) {
        const path = fotoUrl.split("/equipos/")[1]?.split("?")[0];
        if (path) await supabase.storage.from("equipos").remove([path]);
      }

      // 3. Intentar borrar el equipo
      const { error } = await supabase
        .from("equipos")
        .delete()
        .eq("id", equipo.id);

      if (error) {
        if (error.code === "23503") {
          throw new Error(
            "No se puede eliminar: tiene partidos, participaciones o noticias asociadas.",
          );
        }
        throw error;
      }

      onBack();
    } catch (e) {
      setEliminarError(e.message);
    } finally {
      setEliminando(false);
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

  const SECCIONES = [
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
  ];

  return (
    <div>
      <button onClick={onBack} className="adm-back-btn">
        ← Volver
      </button>

      <h1 className="adm-page-title" style={{ marginBottom: "4px" }}>
        {nombreEquipo}
      </h1>
      <p className="adm-page-subtitle" style={{ marginBottom: "24px" }}>
        {equipo.categorias?.nombre} ·{" "}
        {temporada?.temporadas?.nombre ?? temporada?.nombre}
      </p>

      {/* ── Layout principal ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridAutoRows: "1fr",
          gap: "16px",
          height: "100%",
        }}
      >
        {/* ── Columna izquierda ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Foto */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "12px 16px",
                fontSize: "11px",
                fontWeight: 800,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: ".06em",
                borderBottom: "1px solid var(--borde)",
              }}
            >
              Foto del equipo
            </div>
            {fotoUrl ? (
              <div style={{ position: "relative" }}>
                <img
                  src={fotoUrl}
                  alt="Foto del equipo"
                  style={{
                    width: "100%",
                    height: "220px",
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
                  height: "160px",
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
            {fotoError && (
              <p
                style={{
                  fontSize: "12px",
                  color: "#dc2626",
                  padding: "8px 16px",
                }}
              >
                {fotoError}
              </p>
            )}
          </div>

          {/* Sponsor */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "12px 16px",
                fontSize: "11px",
                fontWeight: 800,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: ".06em",
                borderBottom: "1px solid var(--borde)",
              }}
            >
              Sponsor
            </div>
            <div
              style={{
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  flexShrink: 0,
                  borderRadius: "8px",
                  border: "1px solid var(--borde)",
                  background: "var(--fondo)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {sponsorActual?.logo_url ? (
                  <img
                    src={sponsorActual.logo_url}
                    alt="Logo"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      padding: "5px",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "1.1rem", opacity: 0.3 }}>🏷️</span>
                )}
              </div>
              <select
                value={sponsorId}
                onChange={(e) => setSponsorId(e.target.value)}
                className="adm-input"
                style={{ flex: 1, margin: 0 }}
              >
                <option value="">Sin sponsor</option>
                {sponsors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
              <button
                onClick={guardarSponsor}
                disabled={guardandoSponsor}
                style={{
                  background: sponsorMsg ? "#22c55e" : "var(--naranja)",
                  color: "white",
                  border: "none",
                  padding: "9px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "background .2s",
                  minWidth: "72px",
                }}
              >
                {sponsorMsg ? "✓" : guardandoSponsor ? "..." : "Guardar"}
              </button>
            </div>
          </div>

          {/* Competiciones adicionales */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "12px 16px",
                fontSize: "11px",
                fontWeight: 800,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: ".06em",
                borderBottom: "1px solid var(--borde)",
              }}
            >
              Otras competiciones
            </div>
            <div style={{ padding: "14px 16px" }}>
              <AdminEquipoCompeticiones supabase={supabase} equipo={equipo} />
            </div>
          </div>
        </div>

        {/* ── Columna derecha: cuadrícula 2×2 ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: "16px",
            height: "100%",
          }}
        >
          {SECCIONES.map(({ key, emoji, label, sub }) => (
            <div
              key={key}
              onClick={() => onIrA(key)}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                cursor: "pointer",
                minHeight: "160px",
                gap: "10px",
                transition: "border-color .15s, transform .15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--naranja)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--borde)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span style={{ fontSize: "32px" }}>{emoji}</span>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  {label}
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                  {sub}
                </div>
              </div>
            </div>
          ))}

          {/* 4ª celda: eliminar equipo, deliberadamente discreto */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              minHeight: "160px",
            }}
          >
            <button
              onClick={eliminarEquipo}
              disabled={eliminando}
              style={{
                background: "none",
                border: "none",
                color: "var(--muted)",
                fontSize: "12px",
                fontWeight: 500,
                cursor: eliminando ? "not-allowed" : "pointer",
                padding: "4px 8px",
                opacity: eliminando ? 0.5 : 1,
                textDecoration: "underline",
                textDecorationColor: "transparent",
                transition: "color .15s, text-decoration-color .15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#dc2626";
                e.currentTarget.style.textDecorationColor = "#dc2626";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--muted)";
                e.currentTarget.style.textDecorationColor = "transparent";
              }}
            >
              {eliminando ? "Eliminando..." : "Eliminar equipo"}
            </button>
            {eliminarError && (
              <p
                style={{
                  fontSize: "10px",
                  color: "#dc2626",
                  textAlign: "center",
                  maxWidth: "140px",
                  margin: 0,
                }}
              >
                {eliminarError}
              </p>
            )}
          </div>
        </div>
      </div>

      <input
        ref={inputFotoRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFotoChange}
        style={{ display: "none" }}
      />
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
