import { useState, useEffect } from "react";

export default function AdminClubes({ supabase, perfil }) {
  const [clubes, setClubes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState("lista"); // "lista" | "editar"
  const [clubSeleccionado, setClubSeleccionado] = useState(null);
  const [form, setForm] = useState(formInicial());
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [subiendoLogo, setSubiendoLogo] = useState(false);

  function formInicial() {
    return { nombre: "", ciudad: "", logo_url: "", es_mi_club: false };
  }

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    const { data } = await supabase.from("clubes").select("*").order("nombre");
    setClubes(data ?? []);
    setCargando(false);
  }

  function nuevo() {
    setClubSeleccionado(null);
    setForm(formInicial());
    setMsg("");
    setError("");
    setVista("editar");
  }

  function editar(club) {
    setClubSeleccionado(club);
    setForm({
      nombre: club.nombre ?? "",
      ciudad: club.ciudad ?? "",
      logo_url: club.logo_url ?? "",
      es_mi_club: club.es_mi_club ?? false,
    });
    setMsg("");
    setError("");
    setVista("editar");
  }

  async function handleLogoFile(file) {
    if (!file) return;
    setSubiendoLogo(true);
    setError("");
    const ext = file.name.split(".").pop();
    const ruta = `clubes/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("escudos")
      .upload(ruta, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      setError("Error al subir el logo: " + uploadError.message);
      setSubiendoLogo(false);
      return;
    }
    const { data } = supabase.storage.from("escudos").getPublicUrl(ruta);
    setForm((f) => ({ ...f, logo_url: data.publicUrl }));
    setSubiendoLogo(false);
  }

  async function guardar() {
    setError("");
    setMsg("");
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    const payload = {
      nombre: form.nombre.trim(),
      ciudad: form.ciudad.trim() || null,
      logo_url: form.logo_url.trim() || null,
      es_mi_club: form.es_mi_club,
    };
    let err;
    if (clubSeleccionado) {
      ({ error: err } = await supabase
        .from("clubes")
        .update(payload)
        .eq("id", clubSeleccionado.id));
    } else {
      ({ error: err } = await supabase.from("clubes").insert(payload));
    }
    if (err) {
      setError(err.message ?? "Error al guardar");
      return;
    }
    setMsg(clubSeleccionado ? "Club actualizado ✓" : "Club creado ✓");
    await cargar();
    setTimeout(() => {
      setVista("lista");
      setMsg("");
    }, 1000);
  }

  async function eliminar(id) {
    if (
      !confirm(
        "¿Eliminar este club? También se eliminarán sus equipos rivales.",
      )
    )
      return;
    await supabase.from("clubes").delete().eq("id", id);
    cargar();
  }

  if (cargando)
    return <p style={{ color: "var(--muted)" }}>Cargando clubes...</p>;

  return (
    <div>
      <div className="adm-header">
        <div>
          <h1 className="adm-page-title">Clubes</h1>
          <p className="adm-page-subtitle">Gestión de clubes rivales</p>
        </div>
        {vista === "lista" ? (
          <button onClick={nuevo} className="adm-btn-primary">
            + Nuevo club
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
          {clubes.length === 0 && (
            <p className="adm-empty">No hay clubes. Crea el primero.</p>
          )}
          {clubes.map((club) => (
            <div
              key={club.id}
              className="card"
              style={{ display: "flex", alignItems: "center", gap: "12px" }}
            >
              {/* Escudo */}
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "8px",
                  background: "var(--fondo)",
                  border: "1px solid var(--borde)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {club.logo_url ? (
                  <img
                    src={club.logo_url}
                    alt={club.nombre}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "20px" }}>🏀</span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="adm-card-title">{club.nombre}</div>
                {club.ciudad && (
                  <div className="adm-card-subtitle">{club.ciudad}</div>
                )}
              </div>

              {club.es_mi_club && (
                <span className="adm-pill adm-pill--active">Mi club</span>
              )}

              <div className="adm-actions" style={{ flexShrink: 0 }}>
                <button
                  onClick={() => editar(club)}
                  className="adm-btn-secondary"
                >
                  Editar
                </button>
                {!club.es_mi_club && perfil?.rol === "admin" && (
                  <button
                    onClick={() => eliminar(club.id)}
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
          <div className="adm-field">
            <label className="adm-label">Nombre del club *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) =>
                setForm((f) => ({ ...f, nombre: e.target.value }))
              }
              placeholder="Ej: Club Baloncesto Huesca"
              className="adm-input"
            />
          </div>

          <div className="adm-field">
            <label className="adm-label">Ciudad</label>
            <input
              type="text"
              value={form.ciudad}
              onChange={(e) =>
                setForm((f) => ({ ...f, ciudad: e.target.value }))
              }
              placeholder="Ej: Huesca"
              className="adm-input"
            />
          </div>

          <div className="adm-field">
            <label className="adm-label">Logo / Escudo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleLogoFile(e.target.files[0])}
              className="adm-input"
              style={{ padding: "6px" }}
            />
            <input
              type="text"
              value={form.logo_url}
              onChange={(e) =>
                setForm((f) => ({ ...f, logo_url: e.target.value }))
              }
              placeholder="O pega una URL: https://..."
              className="adm-input"
              style={{ marginTop: "6px" }}
            />
            {subiendoLogo && (
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  marginTop: "4px",
                }}
              >
                Subiendo logo...
              </p>
            )}
            {form.logo_url && (
              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <img
                  src={form.logo_url}
                  alt="Preview"
                  style={{
                    width: "60px",
                    height: "60px",
                    objectFit: "contain",
                    borderRadius: "8px",
                    border: "1px solid var(--borde)",
                  }}
                  onError={(e) => (e.target.style.display = "none")}
                />
                <button
                  onClick={() => setForm((f) => ({ ...f, logo_url: "" }))}
                  className="adm-btn-secondary"
                  style={{ fontSize: "11px", padding: "3px 8px" }}
                >
                  ✕ Quitar
                </button>
              </div>
            )}
          </div>

          {/* Es mi club */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              onClick={() =>
                setForm((f) => ({ ...f, es_mi_club: !f.es_mi_club }))
              }
              style={{
                width: "40px",
                height: "22px",
                borderRadius: "11px",
                background: form.es_mi_club
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
                  left: form.es_mi_club ? "21px" : "3px",
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
                setForm((f) => ({ ...f, es_mi_club: !f.es_mi_club }))
              }
              style={{
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              Es mi club (CB Jaca)
            </span>
          </div>

          <div className="adm-row">
            <button
              onClick={guardar}
              className="adm-btn-primary"
              disabled={subiendoLogo}
            >
              {clubSeleccionado ? "Guardar cambios" : "Crear club"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
