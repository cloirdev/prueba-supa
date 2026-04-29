import Campo from "./Campo.jsx";

const POSICIONES = ["Base", "Escolta", "Alero", "Ala-Pívot", "Pívot"];
const GENEROS = [
  { val: "masculino", label: "Masculino" },
  { val: "femenino", label: "Femenino" },
];

export default function FormNuevoJugador({
  form,
  onChange,
  onSubmit,
  msg,
  error,
}) {
  return (
    <div className="form-stack">
      {msg && <p className="msg-ok">{msg}</p>}
      {error && <p className="msg-err">{error}</p>}
      <Campo label="Nombre">
        <input
          type="text"
          value={form.nombre}
          onChange={(e) => onChange({ ...form, nombre: e.target.value })}
          placeholder="Carlos"
        />
      </Campo>
      <Campo label="Apellido">
        <input
          type="text"
          value={form.apellido}
          onChange={(e) => onChange({ ...form, apellido: e.target.value })}
          placeholder="García"
        />
      </Campo>
      <Campo label="Posición">
        <select
          value={form.posicion}
          onChange={(e) => onChange({ ...form, posicion: e.target.value })}
        >
          <option value="">Sin posición</option>
          {POSICIONES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Campo>
      <Campo label="Género">
        <select
          value={form.genero}
          onChange={(e) => onChange({ ...form, genero: e.target.value })}
        >
          <option value="">Sin especificar</option>
          {GENEROS.map(({ val, label }) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      </Campo>
      <button className="btn-primary" onClick={onSubmit}>
        Crear jugador
      </button>
    </div>
  );
}
