import { useState, useEffect, useRef } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nombreEquipoPropio(equipo) {
  const sponsor = equipo.sponsors?.nombre ?? equipo.sponsor;
  const categoria = equipo.categorias?.nombre ?? "";
  return sponsor ? `${sponsor} CB Jaca` : `CB Jaca ${categoria}`.trim();
}

// ─── Modal genérico ───────────────────────────────────────────────────────────

function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "24px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "480px",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Modal: Crear / Editar fase ───────────────────────────────────────────────

function ModalFase({
  supabase,
  equipo,
  competicionId,
  temporada,
  fase,
  onGuardado,
  onCerrar,
}) {
  const [form, setForm] = useState({
    nombre: fase?.nombre ?? "",
    tipo: fase?.tipo ?? "grupo",
    orden: fase?.orden ?? 1,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar() {
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!competicionId) {
      setError("Este equipo no tiene competición asignada");
      return;
    }
    setGuardando(true);
    const payload = {
      competicion_id: competicionId,
      temporada_id: temporada.id,
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      orden: parseInt(form.orden) || 1,
    };
    let err;
    if (fase) {
      ({ error: err } = await supabase
        .from("fases_competicion")
        .update(payload)
        .eq("id", fase.id));
    } else {
      ({ error: err } = await supabase
        .from("fases_competicion")
        .insert(payload));
    }
    setGuardando(false);
    if (err) {
      setError(err.message);
      return;
    }
    onGuardado();
  }

  return (
    <Modal onClose={onCerrar}>
      <div style={{ padding: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
            {fase ? "Editar fase" : "Nueva fase"}
          </h2>
          <button
            onClick={onCerrar}
            className="adm-btn-secondary"
            style={{ padding: "4px 10px" }}
          >
            ×
          </button>
        </div>

        <div className="adm-field">
          <label className="adm-label">Nombre *</label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            placeholder='Ej: "Fase 1", "Grupo A", "Playoff"'
            className="adm-input"
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div className="adm-field">
            <label className="adm-label">Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
              className="adm-input"
            >
              <option value="grupo">Grupo / Liga</option>
              <option value="playoff">Playoff</option>
            </select>
          </div>
          <div className="adm-field">
            <label className="adm-label">Orden</label>
            <input
              type="number"
              min={1}
              value={form.orden}
              onChange={(e) =>
                setForm((p) => ({ ...p, orden: e.target.value }))
              }
              className="adm-input"
            />
          </div>
        </div>

        {error && (
          <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "8px" }}>
            {error}
          </p>
        )}

        <div className="adm-row" style={{ marginTop: "20px" }}>
          <button onClick={onCerrar} className="adm-btn-secondary">
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            className="adm-btn-primary"
          >
            {guardando
              ? "Guardando..."
              : fase
                ? "Guardar cambios"
                : "Crear fase"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Pestaña: Participantes ───────────────────────────────────────────────────

function TabParticipantes({ supabase, equipo, fase }) {
  const [participantes, setParticipantes] = useState([]);
  const [clubes, setClubes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ club_id: "", nombre_equipo: "" });
  const [query, setQuery] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const dropRef = useRef(null);
  const [dropPos, setDropPos] = useState(null);

  // En el useEffect de query, añade el cálculo de posición:
  useEffect(() => {
    if (query.length < 2) {
      setSugerencias([]);
      setDropPos(null);
      return;
    }
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    const norm = query.toLowerCase();
    setSugerencias(
      clubes.filter((c) => c.nombre.toLowerCase().includes(norm)).slice(0, 6),
    );
  }, [query, clubes]);

  useEffect(() => {
    cargar();
  }, [fase.id]);

  async function cargar() {
    setCargando(true);
    const [{ data: parts }, { data: cl }] = await Promise.all([
      supabase
        .from("participantes")
        .select(
          "id, nombre_equipo, equipo_id, club_id, clubes(id, nombre, logo_url)",
        )
        .eq("fase_id", fase.id)
        .order("created_at"),
      supabase.from("clubes").select("id, nombre, logo_url").order("nombre"),
    ]);
    setParticipantes(parts ?? []);
    setClubes(cl ?? []);
    setCargando(false);
  }

  function nombreP(p) {
    return p.nombre_equipo ?? p.clubes?.nombre ?? "—";
  }

  // Búsqueda de club
  useEffect(() => {
    if (query.length < 2) {
      setSugerencias([]);
      return;
    }
    const norm = query.toLowerCase();
    setSugerencias(
      clubes.filter((c) => c.nombre.toLowerCase().includes(norm)).slice(0, 6),
    );
  }, [query, clubes]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handler(e) {
      if (
        !dropRef.current?.contains(e.target) &&
        !inputRef.current?.contains(e.target)
      ) {
        setSugerencias([]);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function añadirMiEquipo() {
    setError("");
    setMsg("");
    const { data: miClub } = await supabase
      .from("clubes")
      .select("id")
      .eq("es_mi_club", true)
      .single();
    if (!miClub) {
      setError("No se encontró el club propio");
      return;
    }
    const { error: err } = await supabase.from("participantes").insert({
      fase_id: fase.id,
      club_id: miClub.id,
      equipo_id: equipo.id,
      nombre_equipo: nombreEquipoPropio(equipo),
    });
    if (err) {
      setError(err.message);
      return;
    }
    setMsg("Equipo propio añadido ✓");
    cargar();
  }

  async function añadirClub(club) {
    setError("");
    setMsg("");
    const yaExiste = participantes.some((p) => p.club_id === club.id);
    if (yaExiste) {
      setError("Este club ya está en la fase");
      return;
    }
    const { error: err } = await supabase.from("participantes").insert({
      fase_id: fase.id,
      club_id: club.id,
      equipo_id: null,
      nombre_equipo: club.nombre,
    });
    if (err) {
      setError(err.message);
      return;
    }
    setQuery("");
    setSugerencias([]);
    setMsg(`${club.nombre} añadido ✓`);
    cargar();
  }

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
    cargar();
  }

  async function eliminar(id) {
    if (!confirm("¿Quitar este participante de la fase?")) return;
    await supabase.from("participantes").delete().eq("id", id);
    cargar();
  }

  const yaEstaMiEquipo = participantes.some((p) => p.equipo_id === equipo.id);

  if (cargando)
    return (
      <p style={{ color: "var(--muted)", fontSize: "13px" }}>Cargando...</p>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {msg && <p className="adm-msg-success">{msg}</p>}
      {error && <p className="adm-msg-error">{error}</p>}

      {/* ── Tabla de participantes ── */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid var(--borde)" }}>
              {["Equipo", "Club", ""].map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: "10px 14px",
                    textAlign: i === 0 ? "left" : i === 1 ? "left" : "right",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {participantes.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: "var(--muted)",
                    fontSize: "13px",
                  }}
                >
                  No hay participantes. Añade el primero abajo.
                </td>
              </tr>
            ) : (
              participantes.map((p) => (
                <tr
                  key={p.id}
                  style={{ borderBottom: "1px solid var(--borde)" }}
                >
                  {editando?.id === p.id ? (
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
                      <td style={{ padding: "8px 14px", textAlign: "right" }}>
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
                            style={{ padding: "5px 12px", fontSize: "12px" }}
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditando(null)}
                            className="adm-btn-secondary"
                            style={{ padding: "5px 12px", fontSize: "12px" }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
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
                                width: "22px",
                                height: "22px",
                                objectFit: "contain",
                                flexShrink: 0,
                              }}
                            />
                          )}
                          {nombreP(p)}
                          {p.equipo_id === equipo.id && (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                color: "var(--naranja)",
                                background: "rgba(249,115,22,0.1)",
                                padding: "1px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              Nosotros
                            </span>
                          )}
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
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
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
                            style={{ padding: "5px 10px", fontSize: "12px" }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => eliminar(p.id)}
                            className="adm-btn-danger"
                            style={{ padding: "5px 10px", fontSize: "12px" }}
                          >
                            Quitar
                          </button>
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

      {/* ── Añadir ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          maxWidth: "480px",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: 800,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: ".06em",
            margin: 0,
          }}
        >
          Añadir equipo
        </p>

        {/* Añadir mi equipo */}
        {!yaEstaMiEquipo && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid var(--borde)",
              background: "var(--fondo)",
            }}
          >
            <div style={{ flex: 1, fontSize: "13px", fontWeight: 600 }}>
              {nombreEquipoPropio(equipo)}
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--muted)",
                  fontWeight: 400,
                  marginLeft: "6px",
                }}
              >
                — nuestro equipo
              </span>
            </div>
            <button
              onClick={añadirMiEquipo}
              className="adm-btn-primary"
              style={{ padding: "6px 14px", fontSize: "12px" }}
            >
              Añadir
            </button>
          </div>
        )}

        {/* Buscar rival */}
        <div style={{ position: "relative" }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar club rival..."
            className="adm-input"
          />
          {sugerencias.length > 0 && dropPos && (
            <div
              ref={dropRef}
              style={{
                position: "fixed",
                top: dropPos.top,
                left: dropPos.left,
                width: dropPos.width,
                zIndex: 1000,
                background: "var(--card)",
                border: "1px solid var(--borde)",
                borderRadius: "8px",
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              }}
            >
              {sugerencias.map((c) => {
                const yaExiste = participantes.some((p) => p.club_id === c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => !yaExiste && añadirClub(c)}
                    style={{
                      padding: "10px 14px",
                      fontSize: "13px",
                      cursor: yaExiste ? "default" : "pointer",
                      opacity: yaExiste ? 0.4 : 1,
                      borderBottom: "1px solid var(--borde)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                    onMouseEnter={(e) =>
                      !yaExiste &&
                      (e.currentTarget.style.background = "var(--fondo)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span>{c.nombre}</span>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                      {yaExiste ? "Ya añadido" : "Añadir"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pestaña: Clasificación ───────────────────────────────────────────────────

function TabClasificacion({ supabase, equipo, fase }) {
  const [participantes, setParticipantes] = useState([]);
  const [clasificacion, setClasificacion] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null);
  const [valoresEdit, setValoresEdit] = useState({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargar();
  }, [fase.id]);

  async function cargar() {
    setCargando(true);
    const [{ data: parts }, { data: cls }] = await Promise.all([
      supabase
        .from("participantes")
        .select("*, clubes(nombre, logo_url)")
        .eq("fase_id", fase.id),
      supabase.from("clasificacion").select("*").eq("fase_id", fase.id),
    ]);
    setParticipantes(parts ?? []);
    setClasificacion(cls ?? []);
    setCargando(false);
  }

  const filas = participantes
    .map((p) => {
      const cls = clasificacion.find((c) => c.participante_id === p.id);
      return {
        participante: p,
        cls,
        nombre: p.nombre_equipo ?? p.clubes?.nombre ?? "—",
        esMiEquipo: p.equipo_id === equipo.id,
      };
    })
    .sort((a, b) => (a.cls?.posicion ?? 999) - (b.cls?.posicion ?? 999));

  function iniciarEdicion(fila) {
    setEditando(fila.participante.id);
    setValoresEdit({
      posicion: fila.cls?.posicion ?? "",
      partidos_jugados: fila.cls?.partidos_jugados ?? 0,
      victorias: fila.cls?.victorias ?? 0,
      derrotas: fila.cls?.derrotas ?? 0,
      puntos_favor: fila.cls?.puntos_favor ?? 0,
      puntos_contra: fila.cls?.puntos_contra ?? 0,
    });
  }

  function setVal(k, v) {
    setValoresEdit((p) => ({ ...p, [k]: v }));
  }

  async function guardarEdicion(fila) {
    setGuardando(true);
    const posicion =
      valoresEdit.posicion !== "" ? parseInt(valoresEdit.posicion) : null;
    const payload = {
      participante_id: fila.participante.id,
      fase_id: fase.id,
      posicion,
      partidos_jugados: parseInt(valoresEdit.partidos_jugados) || 0,
      victorias: parseInt(valoresEdit.victorias) || 0,
      derrotas: parseInt(valoresEdit.derrotas) || 0,
      puntos_favor: parseInt(valoresEdit.puntos_favor) || 0,
      puntos_contra: parseInt(valoresEdit.puntos_contra) || 0,
    };
    if (fila.cls) {
      await supabase
        .from("clasificacion")
        .update(payload)
        .eq("id", fila.cls.id);
    } else {
      await supabase.from("clasificacion").insert(payload);
    }
    setGuardando(false);
    setEditando(null);
    cargar();
  }

  const inputNum = (key, w = "52px") => (
    <input
      type="number"
      min={0}
      style={{
        width: w,
        padding: "5px 4px",
        borderRadius: "6px",
        border: "1px solid var(--borde)",
        background: "var(--fondo)",
        color: "var(--texto)",
        fontSize: "13px",
        fontWeight: 700,
        textAlign: "center",
      }}
      value={valoresEdit[key]}
      onChange={(e) => setVal(key, e.target.value)}
    />
  );

  if (cargando)
    return (
      <p style={{ color: "var(--muted)", fontSize: "13px" }}>Cargando...</p>
    );

  if (filas.length === 0)
    return (
      <p
        style={{
          color: "var(--muted)",
          fontSize: "13px",
          textAlign: "center",
          padding: "32px 0",
        }}
      >
        Añade participantes primero en la pestaña "Equipos".
      </p>
    );

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid var(--borde)" }}>
            {["#", "Equipo", "PJ", "V", "D", "PF", "PC", "Dif", ""].map(
              (h, i) => (
                <th
                  key={i}
                  style={{
                    padding: "8px 10px",
                    textAlign: i <= 1 ? "left" : "center",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => {
            const enEdicion = editando === fila.participante.id;
            const dif =
              (fila.cls?.puntos_favor ?? 0) - (fila.cls?.puntos_contra ?? 0);
            return (
              <tr
                key={fila.participante.id}
                style={{
                  borderBottom: "1px solid var(--borde)",
                  background: fila.esMiEquipo
                    ? "rgba(249,115,22,0.04)"
                    : "transparent",
                }}
              >
                <td style={{ padding: "10px 10px", width: "36px" }}>
                  {enEdicion ? (
                    inputNum("posicion", "44px")
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "24px",
                        height: "24px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 800,
                        background:
                          fila.cls?.posicion === 1
                            ? "var(--naranja)"
                            : "var(--fondo)",
                        color:
                          fila.cls?.posicion === 1 ? "#fff" : "var(--texto)",
                      }}
                    >
                      {fila.cls?.posicion ?? "—"}
                    </span>
                  )}
                </td>
                <td style={{ padding: "10px 10px" }}>
                  <span style={{ fontWeight: fila.esMiEquipo ? 700 : 500 }}>
                    {fila.nombre}
                  </span>
                </td>
                {enEdicion ? (
                  <>
                    {[
                      "partidos_jugados",
                      "victorias",
                      "derrotas",
                      "puntos_favor",
                      "puntos_contra",
                    ].map((k) => (
                      <td
                        key={k}
                        style={{ padding: "6px 4px", textAlign: "center" }}
                      >
                        {inputNum(k)}
                      </td>
                    ))}
                    <td style={{ padding: "6px 4px", textAlign: "center" }}>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                        —
                      </span>
                    </td>
                  </>
                ) : (
                  <>
                    {[
                      fila.cls?.partidos_jugados ?? 0,
                      fila.cls?.victorias ?? 0,
                      fila.cls?.derrotas ?? 0,
                      fila.cls?.puntos_favor ?? 0,
                      fila.cls?.puntos_contra ?? 0,
                    ].map((v, i) => (
                      <td
                        key={i}
                        style={{
                          padding: "10px 10px",
                          textAlign: "center",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {v}
                      </td>
                    ))}
                    <td
                      style={{
                        padding: "10px 10px",
                        textAlign: "center",
                        fontWeight: 700,
                        color:
                          dif > 0
                            ? "#22c55e"
                            : dif < 0
                              ? "#ef4444"
                              : "var(--muted)",
                      }}
                    >
                      {dif > 0 ? `+${dif}` : dif}
                    </td>
                  </>
                )}
                <td
                  style={{
                    padding: "6px 10px",
                    textAlign: "right",
                    whiteSpace: "nowrap",
                  }}
                >
                  {enEdicion ? (
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => setEditando(null)}
                        className="adm-btn-secondary"
                        style={{ padding: "5px 10px", fontSize: "12px" }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => guardarEdicion(fila)}
                        disabled={guardando}
                        className="adm-btn-primary"
                        style={{ padding: "5px 10px", fontSize: "12px" }}
                      >
                        {guardando ? "..." : "Guardar"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => iniciarEdicion(fila)}
                      style={{
                        background: "transparent",
                        border: "1px solid var(--borde)",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        cursor: "pointer",
                        fontSize: "12px",
                        color: "var(--muted)",
                      }}
                    >
                      ✏️
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminFase({ supabase, equipo, temporada }) {
  const [fases, setFases] = useState([]);
  const [faseActiva, setFaseActiva] = useState(null);
  const [tab, setTab] = useState("equipos");
  const [cargando, setCargando] = useState(true);
  const [modalFase, setModalFase] = useState(null); // null | "crear" | fase (objeto)
  const [msg, setMsg] = useState("");

  // Resolver competicion_id
  const competicionId =
    equipo.competicion_id ??
    equipo.equipo_competiciones?.[0]?.competicion_id ??
    null;

  useEffect(() => {
    cargarFases();
  }, [equipo.id, temporada.id, equipo.sponsors?.nombre]);

  async function cargarFases(mantenerActiva = false) {
    setCargando(true);
    const { data } = await supabase
      .from("fases_competicion")
      .select("*")
      .eq("competicion_id", competicionId)
      .eq("temporada_id", temporada.id)
      .order("orden", { ascending: true });
    const lista = data ?? [];
    setFases(lista);
    if (lista.length > 0) {
      const activa =
        mantenerActiva && faseActiva
          ? (lista.find((f) => f.id === faseActiva.id) ?? lista[0])
          : lista[0];
      setFaseActiva(activa);
    } else {
      setFaseActiva(null);
    }
    setCargando(false);
  }

  async function eliminarFase(fase) {
    if (
      !confirm(
        `¿Eliminar la fase "${fase.nombre}"? Se eliminarán también sus participantes y clasificación.`,
      )
    )
      return;
    await supabase.from("clasificacion").delete().eq("fase_id", fase.id);
    await supabase.from("participantes").delete().eq("fase_id", fase.id);
    await supabase.from("fases_competicion").delete().eq("id", fase.id);
    cargarFases();
  }

  // Agrupar fases por orden para mostrar en niveles
  const niveles = fases.reduce((acc, f) => {
    const key = f.orden;
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  if (cargando)
    return <p style={{ color: "var(--muted)" }}>Cargando fases...</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 className="adm-page-title">Fases y clasificación</h1>
          <p className="adm-page-subtitle">{temporada?.nombre ?? ""}</p>
        </div>
        <button
          onClick={() => setModalFase("crear")}
          className="adm-btn-primary"
        >
          + Nueva fase
        </button>
      </div>

      {msg && <p className="adm-msg-success">{msg}</p>}

      {fases.length === 0 ? (
        <div
          style={{
            padding: "48px",
            textAlign: "center",
            border: "1px dashed var(--borde)",
            borderRadius: "12px",
            color: "var(--muted)",
            fontSize: "13px",
          }}
        >
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>🏆</div>
          <div style={{ fontWeight: 600, marginBottom: "4px" }}>
            No hay fases configuradas
          </div>
          <div style={{ fontSize: "12px", marginBottom: "16px" }}>
            Crea la primera fase para empezar a gestionar participantes y
            clasificación
          </div>
          <button
            onClick={() => setModalFase("crear")}
            className="adm-btn-primary"
          >
            Crear primera fase
          </button>
        </div>
      ) : (
        <>
          {/* ── Selector de fases ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {Object.entries(niveles).map(([orden, fasesNivel]) => (
              <div
                key={orden}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                    width: "52px",
                    flexShrink: 0,
                  }}
                >
                  {fasesNivel[0].tipo === "playoff" ? "Final" : `Fase ${orden}`}
                </span>
                <div
                  style={{
                    display: "flex",
                    gap: "4px",
                    flexWrap: "wrap",
                    flex: 1,
                  }}
                >
                  {fasesNivel.map((f) => {
                    const activa = faseActiva?.id === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          setFaseActiva(f);
                          setTab("equipos");
                        }}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          border: "0.5px solid",
                          borderColor: activa
                            ? "var(--naranja)"
                            : "var(--borde)",
                          background: activa ? "var(--naranja)" : "var(--card)",
                          color: activa ? "#fff" : "var(--texto)",
                          transition: "all .15s",
                        }}
                      >
                        {f.nombre}
                      </button>
                    );
                  })}
                </div>
                {/* Acciones de la fase activa de este nivel */}
                {fasesNivel.some((f) => f.id === faseActiva?.id) && (
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      onClick={() => setModalFase(faseActiva)}
                      className="adm-btn-secondary"
                      style={{ padding: "4px 10px", fontSize: "11px" }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => eliminarFase(faseActiva)}
                      className="adm-btn-danger"
                      style={{ padding: "4px 10px", fontSize: "11px" }}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Pestañas ── */}
          {faseActiva && (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {/* Tab bar */}
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid var(--borde)",
                  background: "var(--fondo)",
                }}
              >
                {[
                  { key: "equipos", label: "Equipos" },
                  { key: "clasificacion", label: "Clasificación" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    style={{
                      padding: "12px 20px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: "none",
                      background: "transparent",
                      color: tab === key ? "var(--naranja)" : "var(--muted)",
                      borderBottom:
                        tab === key
                          ? "2px solid var(--naranja)"
                          : "2px solid transparent",
                      transition: "all .15s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Contenido */}
              <div style={{ padding: "20px" }}>
                {tab === "equipos" && (
                  <TabParticipantes
                    supabase={supabase}
                    equipo={equipo}
                    fase={faseActiva}
                  />
                )}
                {tab === "clasificacion" && (
                  <TabClasificacion
                    supabase={supabase}
                    equipo={equipo}
                    fase={faseActiva}
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modal crear / editar fase ── */}
      {modalFase && (
        <ModalFase
          supabase={supabase}
          equipo={equipo}
          competicionId={competicionId}
          temporada={temporada}
          fase={modalFase === "crear" ? null : modalFase}
          onGuardado={() => {
            setModalFase(null);
            cargarFases(true);
            setMsg(
              modalFase === "crear" ? "Fase creada ✓" : "Fase actualizada ✓",
            );
            setTimeout(() => setMsg(""), 2000);
          }}
          onCerrar={() => setModalFase(null)}
        />
      )}
    </div>
  );
}
