import Campo from "../../ui/Campo.jsx";
import SubirFoto from "./SubirFoto.jsx";

const POSICIONES = ["Base", "Escolta", "Alero", "Ala-Pívot", "Pívot"];
const GENEROS = [
  { val: "masculino", label: "Masculino" },
  { val: "femenino", label: "Femenino" },
];

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid var(--borde)",
  background: "var(--fondo)",
  color: "var(--texto)",
  fontSize: "13px",
  boxSizing: "border-box",
  outline: "none",
};

export default function FormNuevoJugador({
  form,
  onChange,
  onSubmit,
  msg,
  error,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {msg && (
        <p
          style={{
            color: "#16a34a",
            fontSize: "13px",
            padding: "10px 14px",
            background: "#f0fdf4",
            borderRadius: "8px",
            border: "1px solid #bbf7d0",
            margin: "0 0 14px",
          }}
        >
          {msg}
        </p>
      )}
      {error && (
        <p
          style={{
            color: "#dc2626",
            fontSize: "13px",
            padding: "10px 14px",
            background: "#fef2f2",
            borderRadius: "8px",
            border: "1px solid #fecaca",
            margin: "0 0 14px",
          }}
        >
          {error}
        </p>
      )}

      <Campo label="Nombre">
        <input
          type="text"
          value={form.nombre}
          onChange={(e) => onChange({ ...form, nombre: e.target.value })}
          placeholder="Carlos"
          style={inputStyle}
        />
      </Campo>

      <Campo label="Apellido">
        <input
          type="text"
          value={form.apellido}
          onChange={(e) => onChange({ ...form, apellido: e.target.value })}
          placeholder="García"
          style={inputStyle}
        />
      </Campo>

      <div style={{ display: "flex", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <Campo label="Posición">
            <select
              value={form.posicion}
              onChange={(e) => onChange({ ...form, posicion: e.target.value })}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">Sin posición</option>
              {POSICIONES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        <div style={{ flex: 1 }}>
          <Campo label="Género">
            <select
              value={form.genero}
              onChange={(e) => onChange({ ...form, genero: e.target.value })}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">Sin especificar</option>
              {GENEROS.map(({ val, label }) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </Campo>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          margin: "4px 0 18px",
        }}
      >
        <div style={{ flex: 1 }}>
          <SubirFoto
            label="Foto DNI"
            previewUrl={form.foto_dni_url}
            onFileSelected={(file) => onChange({ ...form, fotoDniFile: file })}
          />
        </div>
        <div style={{ flex: 1 }}>
          <SubirFoto
            label="Foto de acción"
            previewUrl={form.foto_accion_url}
            onFileSelected={(file) =>
              onChange({ ...form, fotoAccionFile: file })
            }
          />
        </div>
      </div>

      <button
        onClick={onSubmit}
        style={{
          background: "var(--naranja)",
          color: "white",
          border: "none",
          padding: "11px 20px",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Crear jugador
      </button>
    </div>
  );
}
