import { useState, useEffect } from "react";

export default function AdminCompeticionesEquipo({
  supabase,
  equipo,
  temporada,
}) {
  const [asignadas, setAsignadas] = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [seleccionada, setSeleccionada] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const temporadaId = temporada?.temporadas?.id ?? temporada?.id;

  useEffect(() => {
    cargar();
  }, [equipo.id, temporadaId]);

  async function cargar() {
    setCargando(true);
    const [{ data: asig }, { data: todas }] = await Promise.all([
      supabase
        .from("equipo_competiciones")
        .select("competicion_id, competiciones(id, nombre)")
        .eq("equipo_id", equipo.id)
        .eq("temporada_id", temporadaId),
      supabase.from("competiciones").select("id, nombre").order("nombre"),
    ]);

    const asignadasData = (asig ?? [])
      .map((r) => r.competiciones)
      .filter(Boolean);

    const asignadasIds = new Set(asignadasData.map((c) => c.id));
    const disponiblesData = (todas ?? []).filter(
      (c) => !asignadasIds.has(c.id),
    );

    setAsignadas(asignadasData);
    setDisponibles(disponiblesData);
    setSeleccionada("");
    setCargando(false);
  }

  async function añadir() {
    if (!seleccionada) return;
    setGuardando(true);
    await supabase.from("equipo_competiciones").insert({
      equipo_id: equipo.id,
      competicion_id: seleccionada,
      temporada_id: temporadaId,
    });
    setGuardando(false);
    await cargar();
  }

  async function quitar(competicionId) {
    if (!confirm("¿Quitar esta competición del equipo?")) return;
    await supabase
      .from("equipo_competiciones")
      .delete()
      .eq("equipo_id", equipo.id)
      .eq("competicion_id", competicionId)
      .eq("temporada_id", temporadaId);
    await cargar();
  }

  if (cargando)
    return (
      <p style={{ fontSize: "13px", color: "var(--muted)" }}>Cargando...</p>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Lista de competiciones asignadas */}
      {asignadas.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
          Sin competiciones asignadas esta temporada.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {asignadas.map((c) => (
            <div
              key={c.id}
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 600 }}>
                {c.nombre}
              </span>
              <button
                onClick={() => quitar(c.id)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--borde)",
                  color: "var(--muted)",
                  padding: "3px 10px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "11px",
                }}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Añadir nueva */}
      {disponibles.length > 0 && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <select
            value={seleccionada}
            onChange={(e) => setSeleccionada(e.target.value)}
            style={{
              flex: 1,
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid var(--borde)",
              background: "var(--fondo)",
              color: "var(--texto)",
              fontSize: "13px",
            }}
          >
            <option value="">Añadir competición...</option>
            {disponibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <button
            onClick={añadir}
            disabled={!seleccionada || guardando}
            style={{
              background: seleccionada ? "var(--naranja)" : "var(--borde)",
              color: seleccionada ? "white" : "var(--muted)",
              border: "none",
              padding: "9px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: seleccionada ? "pointer" : "not-allowed",
              flexShrink: 0,
              transition: "background .15s",
            }}
          >
            {guardando ? "..." : "Añadir"}
          </button>
        </div>
      )}

      {disponibles.length === 0 && asignadas.length > 0 && (
        <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0 }}>
          Todas las competiciones disponibles ya están asignadas.
        </p>
      )}
    </div>
  );
}
