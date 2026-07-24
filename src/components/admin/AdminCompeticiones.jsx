import { useState, useEffect } from "react";

export default function AdminCompeticiones({ supabase, perfil }) {
  const [competiciones, setCompeticiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState("lista");
  const [seleccionada, setSeleccionada] = useState(null);
  const [form, setForm] = useState({ nombre: "", tipo: "liga" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    const { data } = await supabase
      .from("competiciones")
      .select("id, nombre, tipo")
      .order("nombre");
    setCompeticiones(data ?? []);
    setCargando(false);
  }

  function nuevo() {
    setSeleccionada(null);
    setForm({ nombre: "", tipo: "liga" });
    setMsg("");
    setError("");
    setVista("editar");
  }

  function editar(c) {
    setSeleccionada(c);
    setForm({ nombre: c.nombre, tipo: c.tipo ?? "liga" });
    setMsg("");
    setError("");
    setVista("editar");
  }

  async function guardar() {
    setError("");
    setMsg("");
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    const payload = { nombre: form.nombre.trim(), tipo: form.tipo };

    let err;
    if (seleccionada) {
      ({ error: err } = await supabase
        .from("competiciones")
        .update(payload)
        .eq("id", seleccionada.id));
    } else {
      ({ error: err } = await supabase.from("competiciones").insert(payload));
    }
    if (err) {
      setError(err.message ?? "Error al guardar");
      return;
    }
    setMsg(seleccionada ? "Competición actualizada ✓" : "Competición creada ✓");
    await cargar();
    setTimeout(() => {
      setVista("lista");
      setMsg("");
    }, 1000);
  }

  async function eliminar(id) {
    if (
      !confirm(
        "¿Eliminar esta competición? Esto puede afectar a equipos y fases que la usen.",
      )
    )
      return;
    const { error: err } = await supabase
      .from("competiciones")
      .delete()
      .eq("id", id);
    if (err) {
      alert("No se pudo eliminar: " + err.message);
      return;
    }
    cargar();
  }

  const TIPO_LABEL = {
    liga: "Liga",
    playoff: "Playoff",
    copa: "Copa",
  };

  if (cargando)
    return <p style={{ color: "var(--muted)" }}>Cargando competiciones...</p>;

  return (
    <div>
      <div className="adm-header">
        <div>
          <h1 className="adm-page-title">Competiciones</h1>
          <p className="adm-page-subtitle">
            Ligas, copas y playoffs en los que pueden participar los equipos
          </p>
        </div>
        {vista === "lista" ? (
          <button onClick={nuevo} className="adm-btn-primary">
            + Nueva competición
          </button>
        ) : (
          <button
            onClick={() => {
              setVista("lista");
              setMsg("");
              setError("");
            }}
            className="adm-btn-secondary"
          >
            ← Volver a lista
          </button>
        )}
      </div>

      {msg && <p className="adm-msg-success">{msg}</p>}
      {error && <p className="adm-msg-error">{error}</p>}

      {vista === "lista" && (
        <div className="adm-list">
          {competiciones.length === 0 && (
            <p className="adm-empty">No hay competiciones. Crea la primera.</p>
          )}
          {competiciones.map((c) => (
            <div
              key={c.id}
              className="card adm-card-row"
              style={{ display: "flex", alignItems: "center", gap: "12px" }}
            >
              <div style={{ flex: 1 }}>
                <div className="adm-card-title">{c.nombre}</div>
                <div className="adm-card-subtitle">
                  {TIPO_LABEL[c.tipo] ?? "Sin tipo"}
                </div>
              </div>
              <div className="adm-actions">
                <button onClick={() => editar(c)} className="adm-btn-secondary">
                  Editar
                </button>
                {perfil?.rol === "admin" && (
                  <button
                    onClick={() => eliminar(c.id)}
                    className="adm-btn-danger"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {vista === "editar" && (
        <div className="card adm-form-card" style={{ maxWidth: "480px" }}>
          <div className="adm-field">
            <label className="adm-label">Nombre *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) =>
                setForm((f) => ({ ...f, nombre: e.target.value }))
              }
              placeholder="Ej: 2ª Aragonesa, Copa Aragón..."
              className="adm-input"
            />
          </div>

          <div className="adm-field">
            <label className="adm-label">Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
              className="adm-input"
            >
              <option value="liga">Liga</option>
              <option value="playoff">Playoff</option>
              <option value="copa">Copa</option>
            </select>
          </div>

          <div className="adm-row">
            <button
              onClick={() => {
                setVista("lista");
                setMsg("");
                setError("");
              }}
              className="adm-btn-secondary"
            >
              Cancelar
            </button>
            <button onClick={guardar} className="adm-btn-primary">
              {seleccionada ? "Guardar cambios" : "Crear competición"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
