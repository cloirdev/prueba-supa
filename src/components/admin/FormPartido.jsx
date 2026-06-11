export default function FormPartido({
  form,
  setForm,
  participantes = [],
  clubes = [],
  fases = [],
  equipo,
  vista,
  onGuardar,
  onCancelar,
}) {
  const nombreEquipo =
    equipo.sponsor ?? equipo.categorias?.nombre ?? "Nosotros";

  // Nombre del rival seleccionado
  const nombreRivalSel = (() => {
    if (form.tipo === "amistoso") {
      const club = clubes.find((c) => c.id === form.club_rival_id);
      return club?.nombre ?? "Rival";
    }
    const p = participantes.find((p) => p.id === form.participante_id);
    return p?.nombre_equipo ?? p?.clubes?.nombre ?? "Rival";
  })();

  const labelLocal = form.es_local
    ? `${nombreEquipo} (local)`
    : `${nombreRivalSel} (local)`;
  const labelVisitante = form.es_local
    ? `${nombreRivalSel} (visitante)`
    : `${nombreEquipo} (visitante)`;

  // Participantes de la fase seleccionada, excluyendo el equipo propio
  const participantesFase = participantes.filter(
    (p) => !form.fase_id || p.fase_id === form.fase_id,
  );

  return (
    <div className="card adm-form-card" style={{ maxWidth: "520px" }}>
      {/* Tipo de partido */}
      <div className="adm-field">
        <label className="adm-label">Tipo de partido</label>
        <select
          value={form.tipo}
          onChange={(e) =>
            setForm({
              ...form,
              tipo: e.target.value,
              jornada: "",
              participante_id: "",
              club_rival_id: "",
              fase_id: "",
            })
          }
          className="adm-input"
        >
          <option value="liga">Liga regular</option>
          <option value="copa">Copa</option>
          <option value="playoff">Playoff</option>
          <option value="amistoso">Amistoso</option>
        </select>
      </div>

      {/* Fase (liga / copa / playoff) */}
      {form.tipo !== "amistoso" && fases.length > 0 && (
        <div className="adm-field">
          <label className="adm-label">Competición / Fase</label>
          <select
            value={form.fase_id}
            onChange={(e) =>
              setForm({ ...form, fase_id: e.target.value, participante_id: "" })
            }
            className="adm-input"
          >
            <option value="">Selecciona una fase...</option>
            {fases.map((f) => (
              <option key={f.id} value={f.id}>
                {f.competiciones?.nombre} — {f.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Rival (competición) */}
      {form.tipo !== "amistoso" && (
        <div className="adm-field">
          <label className="adm-label">Rival</label>
          {participantesFase.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>
              {form.fase_id
                ? "No hay rivales en esta fase."
                : "Selecciona una fase primero."}
            </p>
          ) : (
            <select
              value={form.participante_id}
              onChange={(e) =>
                setForm({ ...form, participante_id: e.target.value })
              }
              className="adm-input"
            >
              <option value="">Selecciona un rival...</option>
              {participantesFase.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre_equipo ?? p.clubes?.nombre ?? p.id}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Rival (amistoso) — solo club libre */}
      {form.tipo === "amistoso" && (
        <div className="adm-field">
          <label className="adm-label">Club rival</label>
          <select
            value={form.club_rival_id}
            onChange={(e) =>
              setForm({ ...form, club_rival_id: e.target.value })
            }
            className="adm-input"
          >
            <option value="">Selecciona un club...</option>
            {clubes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Jornada (liga) */}
      {form.tipo === "liga" && (
        <div className="adm-field">
          <label className="adm-label">Jornada</label>
          <input
            type="number"
            min="1"
            value={form.jornada}
            onChange={(e) => setForm({ ...form, jornada: e.target.value })}
            placeholder="1"
            className="adm-input"
          />
        </div>
      )}

      {/* Ronda (copa / playoff) */}
      {(form.tipo === "copa" || form.tipo === "playoff") && (
        <div className="adm-field">
          <label className="adm-label">Ronda</label>
          <select
            value={form.jornada}
            onChange={(e) => setForm({ ...form, jornada: e.target.value })}
            className="adm-input"
          >
            <option value="">Selecciona ronda</option>
            <option value="Octavos">Octavos de final</option>
            <option value="Cuartos">Cuartos de final</option>
            <option value="Semifinal">Semifinal</option>
            <option value="Final">Final</option>
          </select>
        </div>
      )}

      {/* Fecha */}
      <div className="adm-field">
        <label className="adm-label">Fecha</label>
        <input
          type="date"
          value={form.fecha}
          onChange={(e) => setForm({ ...form, fecha: e.target.value })}
          className="adm-input"
        />
      </div>

      {/* Condición */}
      <div className="adm-field">
        <label className="adm-label">Condición</label>
        <select
          value={form.es_local ? "local" : "visitante"}
          onChange={(e) =>
            setForm({ ...form, es_local: e.target.value === "local" })
          }
          className="adm-input"
        >
          <option value="local">Local</option>
          <option value="visitante">Visitante</option>
        </select>
      </div>

      {/* Toggle disputado */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          type="button"
          role="switch"
          aria-checked={form.disputado}
          onClick={() => setForm({ ...form, disputado: !form.disputado })}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              setForm({ ...form, disputado: !form.disputado });
            }
          }}
          style={{
            width: "40px",
            height: "22px",
            borderRadius: "11px",
            background: form.disputado ? "var(--naranja)" : "var(--borde)",
            position: "relative",
            cursor: "pointer",
            transition: "background .2s",
            flexShrink: 0,
            border: "none",
            padding: 0,
            outline: "none",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.boxShadow = "0 0 0 2px var(--naranja)")
          }
          onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
        >
          <div
            style={{
              position: "absolute",
              top: "3px",
              left: form.disputado ? "21px" : "3px",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "white",
              transition: "left .2s",
              boxShadow: "0 1px 3px rgba(0,0,0,.2)",
            }}
          />
        </button>
        <span
          onClick={() => setForm({ ...form, disputado: !form.disputado })}
          style={{
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          Partido ya disputado
        </span>
      </div>

      {/* Resultado */}
      {form.disputado && (
        <div
          style={{
            background: "var(--fondo)",
            border: "1px solid var(--borde)",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: ".06em",
              marginBottom: "14px",
            }}
          >
            Resultado
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            {[
              ["puntos_local", labelLocal],
              ["puntos_visitante", labelVisitante],
            ].map(([campo, label]) => (
              <div key={campo} className="adm-field">
                <label className="adm-label">{label}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form[campo]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [campo]: e.target.value.replace(/[^0-9]/g, ""),
                    })
                  }
                  placeholder="0"
                  className="adm-input"
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    textAlign: "center",
                  }}
                />
              </div>
            ))}
          </div>

          {form.puntos_local !== "" &&
            form.puntos_visitante !== "" &&
            (() => {
              const pFav = form.es_local
                ? parseInt(form.puntos_local)
                : parseInt(form.puntos_visitante);
              const pCon = form.es_local
                ? parseInt(form.puntos_visitante)
                : parseInt(form.puntos_local);
              const win = pFav > pCon;
              return (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: win
                      ? "rgba(249,115,22,0.07)"
                      : "rgba(100,116,139,0.08)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: ".05em",
                      color: win ? "var(--naranja)" : "var(--muted)",
                    }}
                  >
                    {win ? "✓ Victoria" : "✗ Derrota"}
                  </span>
                  <span style={{ color: "var(--muted)" }}>·</span>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>
                    {pFav} – {pCon} a favor
                  </span>
                </div>
              );
            })()}
        </div>
      )}

      {/* Acciones */}
      <div className="adm-row">
        <button onClick={onCancelar} className="adm-btn-secondary">
          Cancelar
        </button>
        <button onClick={onGuardar} className="adm-btn-primary">
          {vista === "editar" ? "Guardar cambios" : "Crear partido"}
        </button>
      </div>
    </div>
  );
}
