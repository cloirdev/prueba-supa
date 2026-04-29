import { useState, useEffect } from "react";

export default function FormNuevoEquipo({ supabase, onCreado, onCancelar }) {
  const [categorias, setCategorias] = useState([]);
  const [competiciones, setCompeticiones] = useState([]);
  const [temporadas, setTemporadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    temporada_id: "",
    categoria_id: "",
    competicion_id: "",
    sponsor: "",
  });

  useEffect(() => {
    async function cargarOpciones() {
      const [{ data: cats }, { data: comps }, { data: temps }] =
        await Promise.all([
          supabase.from("categorias").select("id, nombre").order("orden"),
          supabase.from("competiciones").select("id, nombre").order("nombre"),
          supabase
            .from("temporadas")
            .select("id, nombre")
            .order("nombre", { ascending: false }),
        ]);
      setCategorias(cats ?? []);
      setCompeticiones(comps ?? []);
      setTemporadas(temps ?? []);
      setCargando(false);
    }
    cargarOpciones();
  }, []);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function guardar() {
    setError("");
    if (!form.temporada_id) {
      setError("Selecciona una temporada");
      return;
    }
    if (!form.categoria_id) {
      setError("Selecciona una categoría");
      return;
    }
    if (!form.competicion_id) {
      setError("Selecciona una competición");
      return;
    }

    setGuardando(true);

    const payload = {
      temporada_id: form.temporada_id,
      categoria_id: form.categoria_id,
      competicion_id: form.competicion_id,
      sponsor: form.sponsor.trim() || null,
    };

    const { data, error: err } = await supabase
      .from("equipos")
      .insert(payload)
      .select("id, temporada_id, categoria_id, competicion_id, sponsor")
      .single();

    setGuardando(false);

    if (err) {
      setError(err.message ?? "Error al crear el equipo");
      return;
    }

    onCreado(data);
  }

  if (cargando)
    return (
      <p style={{ color: "var(--muted)", fontSize: "13px" }}>
        Cargando opciones...
      </p>
    );

  return (
    <div
      className="card"
      style={{
        maxWidth: "480px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >
      <div>
        <h2 style={{ margin: "0 0 4px", fontSize: "16px" }}>Nuevo equipo</h2>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
          Los campos marcados con * son obligatorios.
        </p>
      </div>

      {error && (
        <p
          style={{
            color: "#dc2626",
            fontSize: "13px",
            padding: "10px 14px",
            background: "#fef2f2",
            borderRadius: "8px",
            border: "1px solid #fecaca",
            margin: 0,
          }}
        >
          {error}
        </p>
      )}

      {/* Temporada */}
      <Field label="Temporada *">
        <select
          value={form.temporada_id}
          onChange={(e) => set("temporada_id", e.target.value)}
          style={inputStyle}
        >
          <option value="">Selecciona temporada...</option>
          {temporadas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </Field>

      {/* Categoría */}
      <Field label="Categoría *">
        <select
          value={form.categoria_id}
          onChange={(e) => set("categoria_id", e.target.value)}
          style={inputStyle}
        >
          <option value="">Selecciona categoría...</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </Field>

      {/* Competición */}
      <Field label="Competición *">
        <select
          value={form.competicion_id}
          onChange={(e) => set("competicion_id", e.target.value)}
          style={inputStyle}
        >
          <option value="">Selecciona competición...</option>
          {competiciones.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </Field>

      {/* Sponsor (opcional) */}
      <Field
        label="Sponsor"
        hint="Nombre comercial del equipo esta temporada (ej. «Aloha Jaca»)"
      >
        <input
          type="text"
          value={form.sponsor}
          onChange={(e) => set("sponsor", e.target.value)}
          placeholder="Aloha Jaca"
          style={inputStyle}
        />
      </Field>

      {/* Preview del nombre resultante */}
      {(form.categoria_id || form.sponsor) && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "rgba(249,115,22,0.06)",
            border: "1px solid rgba(249,115,22,0.2)",
            fontSize: "13px",
          }}
        >
          <span
            style={{
              color: "var(--muted)",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".06em",
              display: "block",
              marginBottom: "4px",
            }}
          >
            Vista previa
          </span>
          <span style={{ fontWeight: 700, color: "var(--naranja)" }}>
            {form.sponsor.trim() ||
              categorias.find((c) => c.id === form.categoria_id)?.nombre ||
              "—"}
          </span>
          {form.categoria_id && (
            <span
              style={{
                color: "var(--muted)",
                marginLeft: "6px",
                fontSize: "12px",
              }}
            >
              · {categorias.find((c) => c.id === form.categoria_id)?.nombre}
              {form.temporada_id && (
                <>
                  {" "}
                  · {temporadas.find((t) => t.id === form.temporada_id)?.nombre}
                </>
              )}
            </span>
          )}
        </div>
      )}

      {/* Acciones */}
      <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
        <button
          onClick={guardar}
          disabled={guardando}
          style={{
            ...btnPrimaryStyle,
            opacity: guardando ? 0.6 : 1,
            cursor: guardando ? "not-allowed" : "pointer",
          }}
        >
          {guardando ? "Creando..." : "Crear equipo"}
        </button>
        <button onClick={onCancelar} style={btnSecondaryStyle}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={labelStyle}>{label}</label>
      {hint && (
        <span
          style={{ fontSize: "11px", color: "var(--muted)", marginTop: "-2px" }}
        >
          {hint}
        </span>
      )}
      {children}
    </div>
  );
}

const labelStyle = {
  fontSize: "12px",
  fontWeight: 700,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: ".05em",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid var(--borde)",
  background: "var(--fondo)",
  color: "var(--texto)",
  fontSize: "13px",
  boxSizing: "border-box",
};

const btnPrimaryStyle = {
  background: "var(--naranja)",
  color: "white",
  border: "none",
  padding: "11px 20px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const btnSecondaryStyle = {
  background: "transparent",
  color: "var(--muted)",
  border: "1px solid var(--borde)",
  padding: "11px 16px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};
