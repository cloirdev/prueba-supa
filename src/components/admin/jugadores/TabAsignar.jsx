import Campo from "./Campo.jsx";

export default function TabAsignar({
  form,
  onChange,
  onAsignar,
  equipos,
  temporadas,
  historial,
  equipoLabel,
}) {
  return (
    <div className="form-stack">
      <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
        Vincula a este jugador con un equipo y temporada específicos.
      </p>
      <Campo label="Equipo">
        <select
          value={form.equipo_id}
          onChange={(e) => onChange({ ...form, equipo_id: e.target.value })}
        >
          <option value="">Selecciona equipo</option>
          {equipos.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {equipoLabel(eq)}
            </option>
          ))}
        </select>
      </Campo>
      <Campo label="Temporada">
        <select
          value={form.temporada_id}
          onChange={(e) => onChange({ ...form, temporada_id: e.target.value })}
        >
          <option value="">Selecciona temporada</option>
          {temporadas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </Campo>
      <Campo label="Dorsal">
        <input
          type="number"
          min="0"
          max="99"
          value={form.dorsal}
          onChange={(e) => onChange({ ...form, dorsal: e.target.value })}
          className="dorsal"
        />
      </Campo>
      <button className="btn-primary" onClick={onAsignar}>
        Asignar
      </button>
      {historial.length > 0 && (
        <div className="asignaciones-lista">
          <div className="asignaciones-titulo">Asignaciones actuales</div>
          {historial.map((h, i) => (
            <div key={i} className="asignacion-row">
              <span style={{ fontWeight: 600, color: "var(--texto)" }}>
                {h.temporadas?.nombre}
              </span>
              {" · "}
              {h.equipos?.sponsor ?? h.equipos?.categorias?.nombre ?? "—"}
              {" · "}#{h.dorsal}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
