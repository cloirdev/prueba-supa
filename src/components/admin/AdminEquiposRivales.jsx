import { useState, useEffect } from "react";

export default function AdminEquiposRivales({ supabase, perfil }) {
  const [rivales, setRivales] = useState([]);
  const [clubes, setClubes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [competiciones, setCompeticiones] = useState([]);
  const [temporadas, setTemporadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState("lista");
  const [rivalSeleccionado, setRivalSeleccionado] = useState(null);
  const [form, setForm] = useState(formInicial());
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [filtroClub, setFiltroClub] = useState("");

  function formInicial() {
    return {
      club_id: "",
      categoria_id: "",
      competicion_id: "",
      temporada_id: "",
      nombre_equipo: "",
    };
  }

  useEffect(() => {
    cargar();
    cargarFiltros();
  }, []);

  async function cargar() {
    const { data } = await supabase
      .from("equipos_rivales")
      .select(
        `
        id, nombre_equipo,
        clubes (id, nombre, logo_url),
        categorias (nombre),
        competiciones (nombre),
        temporadas (nombre)
      `,
      )
      .order("nombre_equipo");
    setRivales(data ?? []);
    setCargando(false);
  }

  async function cargarFiltros() {
    const [{ data: cl }, { data: ca }, { data: co }, { data: te }] =
      await Promise.all([
        supabase.from("clubes").select("id, nombre, logo_url").order("nombre"),
        supabase.from("categorias").select("id, nombre").order("orden"),
        supabase.from("competiciones").select("id, nombre").order("nombre"),
        supabase
          .from("temporadas")
          .select("id, nombre")
          .order("nombre", { ascending: false }),
      ]);
    setClubes(cl ?? []);
    setCategorias(ca ?? []);
    setCompeticiones(co ?? []);
    setTemporadas(te ?? []);
  }

  function nuevo() {
    setRivalSeleccionado(null);
    setForm(formInicial());
    setMsg("");
    setError("");
    setVista("editar");
  }

  function editar(rival) {
    setRivalSeleccionado(rival);
    setForm({
      club_id: rival.clubes?.id ?? "",
      categoria_id: rival.categorias ? (rival.categoria_id ?? "") : "",
      competicion_id: rival.competiciones ? (rival.competicion_id ?? "") : "",
      temporada_id: rival.temporadas ? (rival.temporada_id ?? "") : "",
      nombre_equipo: rival.nombre_equipo ?? "",
    });
    setMsg("");
    setError("");
    setVista("editar");
  }

  async function guardar() {
    setError("");
    setMsg("");
    if (!form.club_id) {
      setError("Selecciona un club");
      return;
    }

    const payload = {
      club_id: form.club_id,
      categoria_id: form.categoria_id || null,
      competicion_id: form.competicion_id || null,
      temporada_id: form.temporada_id || null,
      nombre_equipo: form.nombre_equipo.trim() || null,
    };

    let err;
    if (rivalSeleccionado) {
      ({ error: err } = await supabase
        .from("equipos_rivales")
        .update(payload)
        .eq("id", rivalSeleccionado.id));
    } else {
      ({ error: err } = await supabase.from("equipos_rivales").insert(payload));
    }
    if (err) {
      setError(err.message ?? "Error al guardar");
      return;
    }
    setMsg(
      rivalSeleccionado
        ? "Equipo rival actualizado ✓"
        : "Equipo rival creado ✓",
    );
    await cargar();
    setTimeout(() => {
      setVista("lista");
      setMsg("");
    }, 1000);
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar este equipo rival?")) return;
    await supabase.from("equipos_rivales").delete().eq("id", id);
    cargar();
  }

  const rivalesFiltrados = filtroClub
    ? rivales.filter((r) => r.clubes?.id === filtroClub)
    : rivales;

  if (cargando)
    return <p style={{ color: "var(--muted)" }}>Cargando equipos rivales...</p>;

  return (
    <div>
      <div className="adm-header">
        <div>
          <h1 className="adm-page-title">Equipos Rivales</h1>
          <p className="adm-page-subtitle">
            Equipos de otros clubes con los que competimos
          </p>
        </div>
        {vista === "lista" ? (
          <button onClick={nuevo} className="adm-btn-primary">
            + Nuevo rival
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
        <>
          {/* Filtro por club */}
          {clubes.length > 0 && (
            <div
              style={{
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <label
                className="adm-label"
                style={{ margin: 0, whiteSpace: "nowrap" }}
              >
                Filtrar por club:
              </label>
              <select
                value={filtroClub}
                onChange={(e) => setFiltroClub(e.target.value)}
                className="adm-input"
                style={{ maxWidth: "260px" }}
              >
                <option value="">Todos</option>
                {clubes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="adm-list">
            {rivalesFiltrados.length === 0 && (
              <p className="adm-empty">
                No hay equipos rivales. Crea el primero.
              </p>
            )}
            {rivalesFiltrados.map((r) => (
              <div
                key={r.id}
                className="card"
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                {/* Escudo del club */}
                <div
                  style={{
                    width: "40px",
                    height: "40px",
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
                  {r.clubes?.logo_url ? (
                    <img
                      src={r.clubes.logo_url}
                      alt={r.clubes.nombre}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "18px" }}>🏀</span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="adm-card-title">
                    {r.nombre_equipo ?? r.clubes?.nombre}
                  </div>
                  <div
                    className="adm-card-subtitle"
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                      marginTop: "2px",
                    }}
                  >
                    {r.clubes?.nombre && <span>{r.clubes.nombre}</span>}
                    {r.categorias?.nombre && (
                      <span>· {r.categorias.nombre}</span>
                    )}
                    {r.competiciones?.nombre && (
                      <span>· {r.competiciones.nombre}</span>
                    )}
                    {r.temporadas?.nombre && (
                      <span>· {r.temporadas.nombre}</span>
                    )}
                  </div>
                </div>

                <div className="adm-actions" style={{ flexShrink: 0 }}>
                  <button
                    onClick={() => editar(r)}
                    className="adm-btn-secondary"
                  >
                    Editar
                  </button>
                  {perfil?.rol === "admin" && (
                    <button
                      onClick={() => eliminar(r.id)}
                      className="adm-btn-danger"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Editor ── */}
      {vista === "editar" && (
        <div className="card adm-form-card">
          {/* Club */}
          <div className="adm-field">
            <label className="adm-label">Club *</label>
            <select
              value={form.club_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, club_id: e.target.value }))
              }
              className="adm-input"
            >
              <option value="">Selecciona un club</option>
              {clubes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            {/* Preview escudo del club seleccionado */}
            {form.club_id &&
              (() => {
                const club = clubes.find((c) => c.id === form.club_id);
                return club?.logo_url ? (
                  <div
                    style={{
                      marginTop: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <img
                      src={club.logo_url}
                      alt={club.nombre}
                      style={{
                        width: "36px",
                        height: "36px",
                        objectFit: "contain",
                      }}
                    />
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                      {club.nombre}
                    </span>
                  </div>
                ) : null;
              })()}
          </div>

          {/* Nombre equipo (opcional, se autogenera por trigger) */}
          <div className="adm-field">
            <label className="adm-label">
              Nombre del equipo{" "}
              <span
                style={{
                  fontWeight: 400,
                  fontSize: "11px",
                  color: "var(--muted)",
                  textTransform: "none",
                }}
              >
                — opcional, se genera automáticamente del club
              </span>
            </label>
            <input
              type="text"
              value={form.nombre_equipo}
              onChange={(e) =>
                setForm((f) => ({ ...f, nombre_equipo: e.target.value }))
              }
              placeholder="Ej: CB Huesca Junior"
              className="adm-input"
            />
          </div>

          {/* Categoría */}
          <div className="adm-field">
            <label className="adm-label">Categoría</label>
            <select
              value={form.categoria_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, categoria_id: e.target.value }))
              }
              className="adm-input"
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Competición */}
          <div className="adm-field">
            <label className="adm-label">Competición</label>
            <select
              value={form.competicion_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, competicion_id: e.target.value }))
              }
              className="adm-input"
            >
              <option value="">Sin competición</option>
              {competiciones.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Temporada */}
          <div className="adm-field">
            <label className="adm-label">Temporada</label>
            <select
              value={form.temporada_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, temporada_id: e.target.value }))
              }
              className="adm-input"
            >
              <option value="">Sin temporada</option>
              {temporadas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="adm-row">
            <button onClick={guardar} className="adm-btn-primary">
              {rivalSeleccionado ? "Guardar cambios" : "Crear equipo rival"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
