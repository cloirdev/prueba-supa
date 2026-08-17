import Campo from "../../ui/Campo.jsx";

// Normaliza para comparar sin problemas de mayúsculas/espacios
const normalizarGenero = (g) => (g ?? "").toString().trim().toLowerCase();

export default function TabAsignar({
  form,
  onChange,
  onAsignar,
  equipos,
  temporadas,
  historial,
  equipoLabel,
  jugador,
}) {
  const generoJugador = normalizarGenero(jugador?.genero);

  const equipoCompatible = (eq) => {
    const generoEquipo = normalizarGenero(eq.categorias?.genero);
    if (!generoJugador) return true;
    if (!generoEquipo || generoEquipo === "mixto") return true;
    return generoEquipo === generoJugador;
  };

  const equiposFiltrados = equipos.filter((eq) => {
    if (form.temporada_id && eq.temporadas?.id !== form.temporada_id)
      return false;
    return equipoCompatible(eq);
  });

  const handleAsignar = () => {
    const equipoSeleccionado = equipos.find((eq) => eq.id === form.equipo_id);
    if (equipoSeleccionado && !equipoCompatible(equipoSeleccionado)) {
      alert(
        "Este equipo es de otra categoría de género y no es compatible con el jugador.",
      );
      return;
    }
    onAsignar();
  };

  return (
    <div className="form-stack">
      <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
        Vincula a este jugador con un equipo y temporada específicos.
      </p>

      <Campo label="Temporada">
        <select
          value={form.temporada_id}
          onChange={(e) =>
            onChange({ ...form, temporada_id: e.target.value, equipo_id: "" })
          }
        >
          <option value="">Selecciona temporada</option>
          {temporadas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Equipo">
        <select
          value={form.equipo_id}
          onChange={(e) => onChange({ ...form, equipo_id: e.target.value })}
          disabled={!form.temporada_id}
        >
          <option value="">
            {form.temporada_id
              ? "Selecciona equipo"
              : "Primero selecciona una temporada"}
          </option>
          {equiposFiltrados.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {equipoLabel(eq)}
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

      <button className="btn-primary" onClick={handleAsignar}>
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
