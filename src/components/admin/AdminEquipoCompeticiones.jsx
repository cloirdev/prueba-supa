import { useState, useEffect } from "react";

export default function AdminEquipoCompeticiones({ supabase, equipo }) {
  const [todasCompeticiones, setTodasCompeticiones] = useState([]);
  const [adicionales, setAdicionales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionId, setSeleccionId] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargar();
  }, [equipo.id]);

  async function cargar() {
    setCargando(true);
    const [{ data: comps }, { data: rels }] = await Promise.all([
      supabase.from("competiciones").select("id, nombre, tipo").order("nombre"),
      supabase
        .from("equipo_competiciones")
        .select("competicion_id, competiciones(id, nombre, tipo)")
        .eq("equipo_id", equipo.id),
    ]);
    setTodasCompeticiones(comps ?? []);
    setAdicionales(rels ?? []);
    setCargando(false);
  }

  // Competiciones disponibles: ni la principal del equipo ni las ya añadidas
  const idsExcluidos = new Set([
    equipo.competicion_id,
    ...adicionales.map((a) => a.competicion_id),
  ]);
  const disponibles = todasCompeticiones.filter((c) => !idsExcluidos.has(c.id));

  async function añadir() {
    setError("");
    setMsg("");
    if (!seleccionId) {
      setError("Selecciona una competición");
      return;
    }
    const { error: err } = await supabase.from("equipo_competiciones").insert({
      equipo_id: equipo.id,
      competicion_id: seleccionId,
    });
    if (err) {
      setError(err.message ?? "Error al añadir");
      return;
    }
    setSeleccionId("");
    setMsg("Competición añadida ✓");
    await cargar();
  }

  async function quitar(competicionId) {
    if (!confirm("¿Quitar esta competición adicional del equipo?")) return;
    await supabase
      .from("equipo_competiciones")
      .delete()
      .eq("equipo_id", equipo.id)
      .eq("competicion_id", competicionId);
    cargar();
  }

  const TIPO_LABEL = { liga: "Liga", playoff: "Playoff", copa: "Copa" };

  if (cargando)
    return <p style={{ color: "var(--muted)" }}>Cargando competiciones...</p>;

  return (
    <div className="card" style={{ maxWidth: "520px" }}>
      <p
        style={{
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: "4px",
        }}
      >
        Competiciones adicionales
      </p>
      <p
        style={{
          fontSize: "12px",
          color: "var(--muted)",
          marginBottom: "16px",
        }}
      >
        Además de su competición principal, este equipo puede participar en
        otras competiciones (ej. Copa) sin duplicar el equipo.
      </p>

      {msg && <p className="adm-msg-success">{msg}</p>}
      {error && <p className="adm-msg-error">{error}</p>}

      {adicionales.length === 0 ? (
        <p
          style={{
            fontSize: "13px",
            color: "var(--muted)",
            marginBottom: "16px",
          }}
        >
          No hay competiciones adicionales añadidas.
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          {adicionales.map((a) => (
            <div
              key={a.competicion_id}
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
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 700 }}>
                  {a.competiciones?.nombre}
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                  {TIPO_LABEL[a.competiciones?.tipo] ?? "Sin tipo"}
                </div>
              </div>
              <button
                onClick={() => quitar(a.competicion_id)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--borde)",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  color: "#ef4444",
                  cursor: "pointer",
                }}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}

      {disponibles.length === 0 ? (
        <p style={{ fontSize: "12px", color: "var(--muted)" }}>
          No hay más competiciones disponibles para añadir.
        </p>
      ) : (
        <div style={{ display: "flex", gap: "8px" }}>
          <select
            value={seleccionId}
            onChange={(e) => setSeleccionId(e.target.value)}
            className="adm-input"
            style={{ flex: 1, margin: 0 }}
          >
            <option value="">Selecciona una competición...</option>
            {disponibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <button onClick={añadir} className="adm-btn-primary">
            Añadir
          </button>
        </div>
      )}
    </div>
  );
}
