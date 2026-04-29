// FormPartido.jsx — formulario reutilizable en AdminCalendario y AdminPartido

export default function FormPartido({
  form,
  setForm,
  rivales,
  equipo,
  vista, // "nuevo" | "editar"
  onGuardar,
  onCancelar,
}) {
  const nombreEquipo =
    equipo.sponsor ?? equipo.categorias?.nombre ?? "Nosotros";
  const rivalObj = rivales.find((r) => r.id === form.rival_id);
  const nombreRivalSel = rivalObj?.nombre_equipo ?? "Rival";

  const labelLocal = form.es_local
    ? `${nombreEquipo} (local)`
    : `${nombreRivalSel} (local)`;
  const labelVisitante = form.es_local
    ? `${nombreRivalSel} (visitante)`
    : `${nombreEquipo} (visitante)`;

  return (
    <div className="card adm-form-card" style={{ maxWidth: "520px" }}>
      {/* Rival */}
      <div className="adm-field">
        <label className="adm-label">Rival</label>
        {rivales.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--muted)" }}>
            No hay rivales para esta categoría.
          </p>
        ) : (
          <select
            value={form.rival_id}
            onChange={(e) => setForm({ ...form, rival_id: e.target.value })}
            className="adm-input"
          >
            <option value="">Selecciona un rival...</option>
            {rivales.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre_equipo}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tipo de partido */}
      <div className="adm-field">
        <label className="adm-label">Tipo de partido</label>
        <select
          value={form.tipo}
          onChange={(e) =>
            setForm({ ...form, tipo: e.target.value, jornada: "" })
          }
          className="adm-input"
        >
          <option value="liga">Liga regular</option>
          <option value="copa">Copa</option>
          <option value="playoff">Playoff</option>
          <option value="amistoso">Amistoso</option>
        </select>
      </div>

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
        <div
          onClick={() => setForm({ ...form, disputado: !form.disputado })}
          style={{
            width: "40px",
            height: "22px",
            borderRadius: "11px",
            background: form.disputado ? "var(--naranja)" : "var(--borde)",
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
              left: form.disputado ? "21px" : "3px",
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

          {/* Preview victoria/derrota */}
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
