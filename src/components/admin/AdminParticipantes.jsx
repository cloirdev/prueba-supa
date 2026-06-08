import { useState, useEffect } from "react";

export default function AdminParticipantes({ supabase, perfil }) {
  const [temporadas, setTemporadas] = useState([]);
  const [fases, setFases] = useState([]);
  const [clubes, setClubes] = useState([]);
  const [participantes, setParticipantes] = useState([]);

  const [temporadaId, setTemporadaId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [faseId, setFaseId] = useState("");

  const [cargando, setCargando] = useState(true);
  const [cargandoPart, setCargandoPart] = useState(false);

  const [form, setForm] = useState({ club_id: "", nombre_equipo: "" });
  const [editando, setEditando] = useState(null); // participante en edición inline
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // ── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const [{ data: te }, { data: cl }] = await Promise.all([
        supabase
          .from("temporadas")
          .select("id, nombre")
          .order("nombre", { ascending: false }),
        supabase.from("clubes").select("id, nombre, logo_url").order("nombre"),
      ]);
      setTemporadas(te ?? []);
      setClubes(cl ?? []);
      setCargando(false);
    }
    init();
  }, []);

  // ── Cargar fases al cambiar temporada ────────────────────────────────────
  useEffect(() => {
    setCategoriaId("");
    setFaseId("");
    setParticipantes([]);
    setFases([]);
    if (!temporadaId) return;
    supabase
      .from("fases_competicion")
      .select(
        "id, nombre, categoria_id, categorias(id, nombre), competiciones(nombre)",
      )
      .eq("temporada_id", temporadaId)
      .order("nombre")
      .then(({ data }) => setFases(data ?? []));
  }, [temporadaId]);

  // ── Resetear fase al cambiar categoría ──────────────────────────────────
  useEffect(() => {
    setFaseId("");
    setParticipantes([]);
  }, [categoriaId]);

  // ── Cargar participantes al seleccionar fase ─────────────────────────────
  useEffect(() => {
    setParticipantes([]);
    if (!faseId) return;
    setCargandoPart(true);
    supabase
      .from("participantes")
      .select("id, nombre_equipo, clubes(id, nombre, logo_url)")
      .eq("fase_id", faseId)
      .order("created_at")
      .then(({ data }) => {
        setParticipantes(data ?? []);
        setCargandoPart(false);
      });
  }, [faseId]);

  // ── Derivados ────────────────────────────────────────────────────────────
  const categorias = Array.from(
    new Map(
      fases
        .filter((f) => f.categorias)
        .map((f) => [f.categoria_id, f.categorias]),
    ).entries(),
  ).map(([id, cat]) => ({ id, nombre: cat.nombre }));

  const fasesFiltradas = categoriaId
    ? fases.filter((f) => f.categoria_id === categoriaId)
    : [];

  const faseActual = fases.find((f) => f.id === faseId);

  function nombreParticipante(p) {
    return p.nombre_equipo ?? p.clubes?.nombre ?? "—";
  }

  // ── Guardar nuevo participante ───────────────────────────────────────────
  async function guardar() {
    setError("");
    setMsg("");
    if (!form.club_id) {
      setError("Selecciona un club");
      return;
    }
    const { error: err } = await supabase.from("participantes").insert({
      fase_id: faseId,
      club_id: form.club_id,
      nombre_equipo: form.nombre_equipo.trim() || null,
    });
    if (err) {
      setError(err.message);
      return;
    }
    setForm({ club_id: "", nombre_equipo: "" });
    setMsg("Participante añadido ✓");
    recargarParticipantes();
  }

  // ── Guardar edición inline ───────────────────────────────────────────────
  async function guardarEdicion(p) {
    setError("");
    setMsg("");
    const { error: err } = await supabase
      .from("participantes")
      .update({
        club_id: editando.club_id,
        nombre_equipo: editando.nombre_equipo.trim() || null,
      })
      .eq("id", p.id);
    if (err) {
      setError(err.message);
      return;
    }
    setEditando(null);
    setMsg("Guardado ✓");
    recargarParticipantes();
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar este participante?")) return;
    await supabase.from("participantes").delete().eq("id", id);
    recargarParticipantes();
  }

  async function recargarParticipantes() {
    const { data } = await supabase
      .from("participantes")
      .select("id, nombre_equipo, clubes(id, nombre, logo_url)")
      .eq("fase_id", faseId)
      .order("created_at");
    setParticipantes(data ?? []);
  }

  if (cargando) return <p style={{ color: "var(--muted)" }}>Cargando...</p>;

  return (
    <div>
      <div className="adm-header">
        <div>
          <h1 className="adm-page-title">Participantes</h1>
          <p className="adm-page-subtitle">
            Equipos inscritos en cada fase de competición
          </p>
        </div>
      </div>

      {msg && <p className="adm-msg-success">{msg}</p>}
      {error && <p className="adm-msg-error">{error}</p>}

      {/* ── Filtros en cascada ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "28px",
        }}
      >
        {/* Temporada */}
        <div className="adm-field" style={{ margin: 0 }}>
          <label className="adm-label">Temporada</label>
          <select
            value={temporadaId}
            onChange={(e) => setTemporadaId(e.target.value)}
            className="adm-input"
          >
            <option value="">Selecciona...</option>
            {temporadas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Categoría */}
        <div className="adm-field" style={{ margin: 0 }}>
          <label className="adm-label">Categoría</label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="adm-input"
            disabled={!temporadaId || categorias.length === 0}
          >
            <option value="">Selecciona...</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Fase */}
        <div className="adm-field" style={{ margin: 0 }}>
          <label className="adm-label">Fase</label>
          <select
            value={faseId}
            onChange={(e) => setFaseId(e.target.value)}
            className="adm-input"
            disabled={!categoriaId || fasesFiltradas.length === 0}
          >
            <option value="">Selecciona...</option>
            {fasesFiltradas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.competiciones?.nombre} — {f.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Contenido ── */}
      {!faseId ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "var(--muted)",
            fontSize: "13px",
            border: "1px dashed var(--borde)",
            borderRadius: "10px",
          }}
        >
          Selecciona temporada, categoría y fase para ver los participantes
        </div>
      ) : (
        <div>
          {/* Cabecera de la fase */}
          <div
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "var(--naranja)",
              marginBottom: "16px",
            }}
          >
            {faseActual?.competiciones?.nombre} — {faseActual?.nombre}
          </div>

          {/* Tabla */}
          <div
            className="card"
            style={{ padding: 0, overflow: "hidden", marginBottom: "20px" }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid var(--borde)" }}>
                  <th
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                    }}
                  >
                    Equipo
                  </th>
                  <th
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                    }}
                  >
                    Club
                  </th>
                  <th style={{ width: "120px" }} />
                </tr>
              </thead>
              <tbody>
                {cargandoPart ? (
                  <tr>
                    <td
                      colSpan={3}
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "var(--muted)",
                      }}
                    >
                      Cargando...
                    </td>
                  </tr>
                ) : participantes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "var(--muted)",
                      }}
                    >
                      No hay participantes en esta fase todavía.
                    </td>
                  </tr>
                ) : (
                  participantes.map((p) => (
                    <tr
                      key={p.id}
                      style={{ borderBottom: "1px solid var(--borde)" }}
                    >
                      {editando?.id === p.id ? (
                        // ── Fila en edición ──
                        <>
                          <td style={{ padding: "8px 14px" }}>
                            <input
                              type="text"
                              value={editando.nombre_equipo}
                              onChange={(e) =>
                                setEditando((prev) => ({
                                  ...prev,
                                  nombre_equipo: e.target.value,
                                }))
                              }
                              placeholder={
                                clubes.find((c) => c.id === editando.club_id)
                                  ?.nombre ?? "Nombre del equipo"
                              }
                              className="adm-input"
                              style={{ margin: 0 }}
                            />
                            <p
                              style={{
                                fontSize: "10px",
                                color: "var(--muted)",
                                marginTop: "4px",
                              }}
                            >
                              Se mostrará como:{" "}
                              <strong style={{ color: "var(--texto)" }}>
                                {editando.nombre_equipo.trim() ||
                                  clubes.find((c) => c.id === editando.club_id)
                                    ?.nombre ||
                                  "—"}
                              </strong>
                            </p>
                          </td>
                          <td style={{ padding: "8px 14px" }}>
                            <select
                              value={editando.club_id}
                              onChange={(e) =>
                                setEditando((prev) => ({
                                  ...prev,
                                  club_id: e.target.value,
                                }))
                              }
                              className="adm-input"
                              style={{ margin: 0 }}
                            >
                              {clubes.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.nombre}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td
                            style={{ padding: "8px 14px", textAlign: "right" }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: "6px",
                                justifyContent: "flex-end",
                              }}
                            >
                              <button
                                onClick={() => guardarEdicion(p)}
                                className="adm-btn-primary"
                                style={{
                                  padding: "5px 12px",
                                  fontSize: "12px",
                                }}
                              >
                                Guardar
                              </button>
                              <button
                                onClick={() => setEditando(null)}
                                className="adm-btn-secondary"
                                style={{
                                  padding: "5px 12px",
                                  fontSize: "12px",
                                }}
                              >
                                Cancelar
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        // ── Fila normal ──
                        <>
                          <td style={{ padding: "10px 14px", fontWeight: 600 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              {p.clubes?.logo_url && (
                                <img
                                  src={p.clubes.logo_url}
                                  alt=""
                                  style={{
                                    width: "24px",
                                    height: "24px",
                                    objectFit: "contain",
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                              {nombreParticipante(p)}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "10px 14px",
                              color: "var(--muted)",
                              fontSize: "12px",
                            }}
                          >
                            {p.nombre_equipo ? p.clubes?.nombre : "—"}
                          </td>
                          <td
                            style={{
                              padding: "10px 14px",
                              textAlign: "right",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: "6px",
                                justifyContent: "flex-end",
                              }}
                            >
                              <button
                                onClick={() =>
                                  setEditando({
                                    id: p.id,
                                    club_id: p.clubes?.id ?? "",
                                    nombre_equipo: p.nombre_equipo ?? "",
                                  })
                                }
                                className="adm-btn-secondary"
                                style={{
                                  padding: "5px 12px",
                                  fontSize: "12px",
                                }}
                              >
                                Editar
                              </button>
                              {perfil?.rol === "admin" && (
                                <button
                                  onClick={() => eliminar(p.id)}
                                  className="adm-btn-danger"
                                  style={{
                                    padding: "5px 12px",
                                    fontSize: "12px",
                                  }}
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Añadir participante ── */}
          <div className="card adm-form-card" style={{ maxWidth: "480px" }}>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: ".06em",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: "14px",
              }}
            >
              Añadir participante
            </p>

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
            </div>

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
                  — opcional
                </span>
              </label>
              <input
                type="text"
                value={form.nombre_equipo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nombre_equipo: e.target.value }))
                }
                placeholder={
                  form.club_id
                    ? `Ej: ${clubes.find((c) => c.id === form.club_id)?.nombre ?? ""} A`
                    : "Ej: Fundación Alierta A"
                }
                className="adm-input"
              />
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--muted)",
                  marginTop: "4px",
                }}
              >
                Se mostrará como:{" "}
                <strong style={{ color: "var(--texto)" }}>
                  {form.nombre_equipo.trim() ||
                    clubes.find((c) => c.id === form.club_id)?.nombre ||
                    "—"}
                </strong>
              </p>
            </div>

            <button onClick={guardar} className="adm-btn-primary">
              Añadir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
