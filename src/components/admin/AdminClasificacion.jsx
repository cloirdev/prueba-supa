import { useState, useEffect, useRef } from "react";

const S = {
  card: {
    background: "var(--card, #fff)",
    border: "0.5px solid var(--borde, #e2e8f0)",
    borderRadius: "12px",
    padding: "20px",
  },
  btn: (variant = "primary") => ({
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    border:
      variant !== "primary" ? "0.5px solid var(--borde, #e2e8f0)" : "none",
    background:
      variant === "primary"
        ? "#F97316"
        : variant === "ghost"
          ? "transparent"
          : variant === "danger"
            ? "rgba(239,68,68,0.08)"
            : "var(--card, #fff)",
    color:
      variant === "primary"
        ? "#fff"
        : variant === "ghost"
          ? "var(--muted, #64748b)"
          : variant === "danger"
            ? "#ef4444"
            : "var(--texto, #0f172a)",
  }),
  input: {
    width: "100%",
    padding: "6px 8px",
    borderRadius: "6px",
    border: "0.5px solid var(--borde, #e2e8f0)",
    background: "var(--fondo, #f8fafc)",
    fontSize: "13px",
    color: "var(--texto, #0f172a)",
    outline: "none",
    boxSizing: "border-box",
    textAlign: "center",
  },
  label: {
    fontSize: "11px",
    fontWeight: 700,
    color: "var(--muted, #64748b)",
    textTransform: "uppercase",
    letterSpacing: ".06em",
    marginBottom: "5px",
    display: "block",
  },
  field: { display: "flex", flexDirection: "column", gap: "4px" },
};

function nombreEquipoPropio(equipo) {
  const sponsor = equipo.sponsors?.nombre ?? equipo.sponsor;
  const categoria = equipo.categorias?.nombre ?? "";
  return sponsor ? `${sponsor} CB Jaca` : `CB Jaca ${categoria}`.trim();
}

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
          background: "var(--card, #fff)",
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

// ─── Modal: Gestionar fases ───────────────────────────────────────────────────

function ModalFases({
  supabase,
  equipo,
  temporada,
  fases,
  onCambio,
  onCerrar,
}) {
  const [nueva, setNueva] = useState({ nombre: "", tipo: "grupo", orden: 1 });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function crearFase() {
    if (!nueva.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setGuardando(true);
    const { error: err } = await supabase.from("fases_competicion").insert({
      competicion_id: equipo.competicion_id,
      temporada_id: temporada.id,
      nombre: nueva.nombre.trim(),
      tipo: nueva.tipo,
      orden: parseInt(nueva.orden),
    });
    setGuardando(false);
    if (err) {
      setError(err.message);
      return;
    }
    setNueva({ nombre: "", tipo: "grupo", orden: 1 });
    setError(null);
    onCambio();
  }

  async function eliminarFase(id) {
    if (
      !confirm(
        "¿Eliminar esta fase? Se eliminarán también sus participantes y clasificación.",
      )
    )
      return;
    await supabase.from("clasificacion").delete().eq("fase_id", id);
    await supabase.from("participantes").delete().eq("fase_id", id);
    await supabase.from("fases_competicion").delete().eq("id", id);
    onCambio();
  }

  const fasesOrdenadas = [...fases].sort(
    (a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre),
  );

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
            Gestionar fases
          </h2>
          <button
            onClick={onCerrar}
            style={{ ...S.btn("ghost"), padding: "4px 8px", fontSize: "18px" }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            marginBottom: "20px",
          }}
        >
          {fasesOrdenadas.length === 0 && (
            <div
              style={{
                fontSize: "13px",
                color: "var(--muted)",
                textAlign: "center",
                padding: "16px 0",
              }}
            >
              No hay fases creadas
            </div>
          )}
          {fasesOrdenadas.map((f) => (
            <div
              key={f.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "0.5px solid var(--borde)",
                background: "var(--fondo)",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "4px",
                  textTransform: "uppercase",
                  background:
                    f.tipo === "playoff"
                      ? "rgba(249,115,22,0.12)"
                      : "rgba(99,102,241,0.1)",
                  color: f.tipo === "playoff" ? "#F97316" : "#6366f1",
                }}
              >
                {f.tipo === "playoff" ? "Playoff" : `Fase ${f.orden}`}
              </div>
              <span style={{ flex: 1, fontSize: "13px", fontWeight: 600 }}>
                {f.nombre}
              </span>
              <button
                style={{
                  ...S.btn("danger"),
                  padding: "4px 10px",
                  fontSize: "12px",
                }}
                onClick={() => eliminarFase(f.id)}
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>

        <div
          style={{ borderTop: "0.5px solid var(--borde)", paddingTop: "16px" }}
        >
          <div style={{ ...S.label, marginBottom: "12px" }}>Nueva fase</div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div style={S.field}>
              <span style={S.label}>Nombre</span>
              <input
                style={{ ...S.input, textAlign: "left" }}
                placeholder='Ej: "Grupo A" o "Playoffs"'
                value={nueva.nombre}
                onChange={(e) =>
                  setNueva((p) => ({ ...p, nombre: e.target.value }))
                }
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <div style={S.field}>
                <span style={S.label}>Tipo</span>
                <select
                  style={{ ...S.input, textAlign: "left" }}
                  value={nueva.tipo}
                  onChange={(e) =>
                    setNueva((p) => ({ ...p, tipo: e.target.value }))
                  }
                >
                  <option value="grupo">Grupo / Liga</option>
                  <option value="playoff">Playoff</option>
                </select>
              </div>
              <div style={S.field}>
                <span style={S.label}>Orden</span>
                <input
                  type="number"
                  style={S.input}
                  min={1}
                  value={nueva.orden}
                  onChange={(e) =>
                    setNueva((p) => ({ ...p, orden: e.target.value }))
                  }
                />
              </div>
            </div>
            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "0.5px solid #ef4444",
                  borderRadius: "8px",
                  padding: "10px",
                  fontSize: "12px",
                  color: "#ef4444",
                }}
              >
                {error}
              </div>
            )}
            <button style={S.btn()} onClick={crearFase} disabled={guardando}>
              {guardando ? "Guardando..." : "+ Crear fase"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal: Añadir participante ───────────────────────────────────────────────

function ModalParticipante({
  supabase,
  equipo,
  temporada,
  faseId,
  participantesExistentes,
  onGuardado,
  onCerrar,
}) {
  const [query, setQuery] = useState("");
  const [clubes, setClubes] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [dropdownPos, setDropdownPos] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) {
      setClubes([]);
      setDropdownPos(null);
      return;
    }
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
    supabase
      .from("clubes")
      .select("id, nombre, ciudad, logo_url")
      .ilike("nombre", `%${query}%`)
      .limit(8)
      .then(({ data }) => setClubes(data ?? []));
  }, [query]);

  async function añadirMiEquipo() {
    setGuardando(true);
    const { data: miClub } = await supabase
      .from("clubes")
      .select("id")
      .eq("es_mi_club", true)
      .single();
    await supabase.from("participantes").insert({
      fase_id: faseId,
      club_id: miClub.id,
      equipo_id: equipo.id,
      nombre_equipo: nombreEquipoPropio(equipo),
    });
    setGuardando(false);
    onGuardado();
  }

  async function añadirClub(club) {
    setGuardando(true);
    await supabase.from("participantes").insert({
      fase_id: faseId,
      club_id: club.id,
      equipo_id: null,
      nombre_equipo: club.nombre,
    });
    setGuardando(false);
    onGuardado();
    setQuery("");
    setClubes([]);
    setDropdownPos(null);
  }

  const yaEstaMiEquipo = participantesExistentes.some(
    (p) => p.equipo_id === equipo.id,
  );
  const clubIdsExistentes = new Set(
    participantesExistentes.map((p) => p.club_id).filter(Boolean),
  );

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
            Añadir equipo a la fase
          </h2>
          <button
            onClick={onCerrar}
            style={{ ...S.btn("ghost"), padding: "4px 8px", fontSize: "18px" }}
          >
            ×
          </button>
        </div>

        {!yaEstaMiEquipo && (
          <div
            style={{
              marginBottom: "16px",
              paddingBottom: "16px",
              borderBottom: "0.5px solid var(--borde)",
            }}
          >
            <div style={{ ...S.label, marginBottom: "8px" }}>Mi equipo</div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ flex: 1, fontSize: "13px", fontWeight: 600 }}>
                {nombreEquipoPropio(equipo)}
              </div>
              <button
                style={S.btn()}
                onClick={añadirMiEquipo}
                disabled={guardando}
              >
                Añadir
              </button>
            </div>
          </div>
        )}

        <div style={S.field}>
          <span style={S.label}>Buscar club rival</span>
          <div style={{ position: "relative" }}>
            <input
              ref={inputRef}
              style={{ ...S.input, textAlign: "left" }}
              placeholder="Escribe el nombre del club..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {clubes.length > 0 && dropdownPos && (
              <div
                style={{
                  position: "fixed",
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                  width: dropdownPos.width,
                  zIndex: 2000,
                  background: "var(--card)",
                  border: "0.5px solid var(--borde)",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  maxHeight: "280px",
                  overflowY: "auto",
                }}
              >
                {clubes.map((c) => {
                  const yaExiste = clubIdsExistentes.has(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => !yaExiste && añadirClub(c)}
                      style={{
                        padding: "10px 14px",
                        cursor: yaExiste ? "default" : "pointer",
                        fontSize: "13px",
                        borderBottom: "0.5px solid var(--borde)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        opacity: yaExiste ? 0.4 : 1,
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
                        {yaExiste ? "Ya añadido" : c.ciudad}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <p
            style={{
              fontSize: "11px",
              color: "var(--muted)",
              margin: "4px 0 0",
            }}
          >
            ¿El club no aparece?{" "}
            <span
              style={{ color: "var(--naranja, #F97316)", cursor: "pointer" }}
              onClick={() => window.open("/admin/clubes", "_blank")}
            >
              Créalo primero en Clubes
            </span>
          </p>
        </div>
      </div>
    </Modal>
  );
}

// ─── Tabla de clasificación editable ─────────────────────────────────────────

function TablaClasificacion({
  supabase,
  fase,
  equipo,
  participantes,
  clasificacion,
  onCambio,
}) {
  const [editando, setEditando] = useState(null);
  const [valoresEdit, setValoresEdit] = useState({});
  const [guardando, setGuardando] = useState(false);

  const filas = participantes
    .map((p) => {
      const cls = clasificacion.find((c) => c.participante_id === p.id);
      const esMiEquipo = p.equipo_id === equipo.id;
      // Usar siempre nombre_equipo guardado en participantes como fuente de verdad
      const nombre = p.nombre_equipo ?? p.clubes?.nombre ?? "–";
      return { participante: p, cls, nombre, esMiEquipo };
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

  async function guardarEdicion(fila) {
    setGuardando(true);
    const posicion =
      valoresEdit.posicion !== "" ? parseInt(valoresEdit.posicion) : null;
    if (posicion !== null && posicion > participantes.length) {
      alert(`La posición no puede ser mayor que ${participantes.length}`);
      setGuardando(false);
      return;
    }
    if (posicion !== null && posicion < 1) {
      alert("La posición debe ser mayor que 0");
      setGuardando(false);
      return;
    }
    const posicionOcupada = clasificacion.find(
      (c) =>
        c.posicion === posicion && c.participante_id !== fila.participante.id,
    );
    if (posicionOcupada) {
      const nombre =
        filas.find((f) => f.participante.id === posicionOcupada.participante_id)
          ?.nombre ?? "otro equipo";
      alert(`La posición ${posicion} ya está ocupada por ${nombre}`);
      setGuardando(false);
      return;
    }
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
    onCambio();
  }

  async function eliminarParticipante(participanteId, clsId) {
    if (!confirm("¿Quitar este equipo de la fase?")) return;
    if (clsId) await supabase.from("clasificacion").delete().eq("id", clsId);
    await supabase.from("participantes").delete().eq("id", participanteId);
    onCambio();
  }

  function setVal(k, v) {
    setValoresEdit((p) => ({ ...p, [k]: v }));
  }

  const colInput = (key, w = "52px") => (
    <input
      type="number"
      min={0}
      style={{ ...S.input, width: w, padding: "5px 4px" }}
      value={valoresEdit[key]}
      onChange={(e) => setVal(key, e.target.value)}
    />
  );

  if (filas.length === 0)
    return (
      <div
        style={{
          textAlign: "center",
          padding: "32px",
          color: "var(--muted)",
          fontSize: "13px",
        }}
      >
        No hay equipos en esta fase. Pulsa "+ Añadir equipo" para empezar.
      </div>
    );

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}
      >
        <thead>
          <tr style={{ borderBottom: "0.5px solid var(--borde)" }}>
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
                  borderBottom: "0.5px solid var(--borde)",
                  background: fila.esMiEquipo
                    ? "rgba(249,115,22,0.04)"
                    : "transparent",
                }}
                onMouseEnter={(e) =>
                  !fila.esMiEquipo &&
                  (e.currentTarget.style.background = "var(--fondo)")
                }
                onMouseLeave={(e) =>
                  !fila.esMiEquipo &&
                  (e.currentTarget.style.background = fila.esMiEquipo
                    ? "rgba(249,115,22,0.04)"
                    : "transparent")
                }
              >
                <td style={{ padding: "10px 10px", width: "36px" }}>
                  {enEdicion ? (
                    colInput("posicion", "44px")
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
                          fila.cls?.posicion === 1 ? "#F97316" : "var(--fondo)",
                        color:
                          fila.cls?.posicion === 1 ? "#fff" : "var(--texto)",
                      }}
                    >
                      {fila.cls?.posicion ?? "–"}
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
                        {colInput(k)}
                      </td>
                    ))}
                    <td style={{ padding: "6px 4px", textAlign: "center" }}>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                        –
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
                          color: "var(--texto)",
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
                        fontVariantNumeric: "tabular-nums",
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
                        style={{
                          ...S.btn("outline"),
                          padding: "5px 10px",
                          fontSize: "12px",
                        }}
                        onClick={() => setEditando(null)}
                      >
                        Cancelar
                      </button>
                      <button
                        style={{
                          ...S.btn(),
                          padding: "5px 10px",
                          fontSize: "12px",
                        }}
                        onClick={() => guardarEdicion(fila)}
                        disabled={guardando}
                      >
                        {guardando ? "..." : "Guardar"}
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        gap: "4px",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        style={{
                          ...S.btn("ghost"),
                          padding: "4px 8px",
                          fontSize: "12px",
                        }}
                        onClick={() => iniciarEdicion(fila)}
                      >
                        ✏️
                      </button>
                      <button
                        style={{
                          ...S.btn("ghost"),
                          padding: "4px 8px",
                          fontSize: "12px",
                          color: "#ef4444",
                        }}
                        onClick={() =>
                          eliminarParticipante(
                            fila.participante.id,
                            fila.cls?.id,
                          )
                        }
                      >
                        ✕
                      </button>
                    </div>
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

export default function AdminClasificacion({ supabase, equipo, temporada }) {
  const [fases, setFases] = useState([]);
  const [faseActiva, setFaseActiva] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [clasificacion, setClasificacion] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalFases, setModalFases] = useState(false);
  const [modalParticipante, setModalParticipante] = useState(false);

  useEffect(() => {
    cargarFases();
  }, [equipo?.id, temporada?.id]);

  async function cargarFases(mantenerFaseActiva = false) {
    setCargando(true);
    const { data } = await supabase
      .from("fases_competicion")
      .select("*")
      .eq("competicion_id", equipo.competicion_id)
      .eq("temporada_id", temporada.id)
      .order("orden", { ascending: true });
    const fasesData = data ?? [];
    setFases(fasesData);
    if (fasesData.length > 0) {
      const nuevaActiva =
        mantenerFaseActiva && faseActiva
          ? (fasesData.find((f) => f.id === faseActiva.id) ?? fasesData[0])
          : fasesData[0];
      setFaseActiva(nuevaActiva);
      await cargarFase(nuevaActiva.id);
    } else {
      setFaseActiva(null);
      setParticipantes([]);
      setClasificacion([]);
    }
    setCargando(false);
  }

  async function cargarFase(faseId) {
    const [{ data: parts }, { data: cls }] = await Promise.all([
      supabase
        .from("participantes")
        .select("*, clubes(nombre, ciudad, logo_url)")
        .eq("fase_id", faseId),
      supabase.from("clasificacion").select("*").eq("fase_id", faseId),
    ]);
    setParticipantes(parts ?? []);
    setClasificacion(cls ?? []);
  }

  async function cambiarFase(fase) {
    setFaseActiva(fase);
    await cargarFase(fase.id);
  }

  const niveles = fases.reduce((acc, f) => {
    const key = f.orden;
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: 800,
              color: "var(--texto)",
            }}
          >
            Clasificación
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "13px",
              color: "var(--muted)",
            }}
          >
            {temporada?.nombre ?? ""}
          </p>
        </div>
        <button style={S.btn("outline")} onClick={() => setModalFases(true)}>
          Gestionar fases
        </button>
      </div>

      {!cargando && fases.length === 0 ? (
        <div
          style={{
            ...S.card,
            textAlign: "center",
            padding: "48px",
            color: "var(--muted)",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🏆</div>
          <div
            style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}
          >
            No hay fases configuradas
          </div>
          <div style={{ fontSize: "12px", marginBottom: "16px" }}>
            Crea las fases de la competición para gestionar la clasificación
          </div>
          <button style={S.btn()} onClick={() => setModalFases(true)}>
            Crear primera fase
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {Object.entries(niveles).map(([orden, fasesNivel]) => (
              <div
                key={orden}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
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
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {fasesNivel.map((f) => {
                    const activa = faseActiva?.id === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => cambiarFase(f)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          border: "0.5px solid",
                          borderColor: activa ? "#F97316" : "var(--borde)",
                          background: activa ? "#F97316" : "var(--card)",
                          color: activa ? "#fff" : "var(--texto)",
                          transition: "all .15s",
                        }}
                      >
                        {f.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {faseActiva && (
            <div style={S.card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 700 }}>
                    {faseActiva.nombre}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--muted)",
                      marginTop: "2px",
                    }}
                  >
                    {participantes.length}{" "}
                    {participantes.length === 1 ? "equipo" : "equipos"}
                  </div>
                </div>
                <button
                  style={S.btn()}
                  onClick={() => setModalParticipante(true)}
                >
                  + Añadir equipo
                </button>
              </div>
              {cargando ? (
                <div
                  style={{
                    color: "var(--muted)",
                    fontSize: "13px",
                    padding: "20px 0",
                  }}
                >
                  Cargando...
                </div>
              ) : (
                <TablaClasificacion
                  supabase={supabase}
                  fase={faseActiva}
                  equipo={equipo}
                  participantes={participantes}
                  clasificacion={clasificacion}
                  onCambio={() => cargarFase(faseActiva.id)}
                />
              )}
            </div>
          )}
        </>
      )}

      {modalFases && (
        <ModalFases
          supabase={supabase}
          equipo={equipo}
          temporada={temporada}
          fases={fases}
          onCambio={() => cargarFases(true)}
          onCerrar={() => setModalFases(false)}
        />
      )}

      {modalParticipante && faseActiva && (
        <ModalParticipante
          supabase={supabase}
          equipo={equipo}
          temporada={temporada}
          faseId={faseActiva.id}
          participantesExistentes={participantes}
          onGuardado={() => {
            setModalParticipante(false);
            cargarFase(faseActiva.id);
          }}
          onCerrar={() => setModalParticipante(false)}
        />
      )}
    </div>
  );
}
