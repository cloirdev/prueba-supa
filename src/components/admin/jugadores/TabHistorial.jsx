export default function TabHistorial({
  historial,
  cargando,
  perfil,
  onEliminar,
}) {
  if (cargando)
    return (
      <p style={{ color: "var(--muted)", fontSize: "13px" }}>
        Cargando historial...
      </p>
    );
  if (historial.length === 0)
    return (
      <p style={{ color: "var(--muted)", fontSize: "13px" }}>
        Este jugador no tiene temporadas registradas aún.
      </p>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {historial.map((h, i) => (
        <div key={i} className="card historial-item">
          <div className="historial-item-info">
            <div className="dorsal-badge">{h.dorsal}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "13px" }}>
                {h.equipos?.sponsor ?? h.equipos?.categorias?.nombre ?? "—"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                {h.temporadas?.nombre ?? "—"} · #{h.dorsal}
              </div>
            </div>
          </div>
          {perfil?.rol === "admin" && (
            <button
              className="btn-sm"
              onClick={() => onEliminar(h.equipos?.id, h.temporadas?.id)}
            >
              Quitar
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
