import Campo from "./Campo.jsx";

const POSICIONES = ["Base", "Escolta", "Alero", "Ala-Pívot", "Pívot"];

export default function TabEditar({ form, onChange, onGuardar, onEliminar, perfil }) {
  return (
    <div className="form-stack">
      <Campo label="Nombre">
        <input type="text" value={form.nombre ?? ""} onChange={(e) => onChange({ ...form, nombre: e.target.value })} placeholder="Carlos" />
      </Campo>
      <Campo label="Apellido">
        <input type="text" value={form.apellido ?? ""} onChange={(e) => onChange({ ...form, apellido: e.target.value })} placeholder="García" />
      </Campo>
      <Campo label="Posición">
        <select value={form.posicion ?? ""} onChange={(e) => onChange({ ...form, posicion: e.target.value })}>
          <option value="">Sin posición</option>
          {POSICIONES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </Campo>
      <div className="btn-row">
        <button className="btn-primary" onClick={onGuardar}>Guardar cambios</button>
        {perfil?.rol === "admin" && (
          <button className="btn-danger" onClick={onEliminar}>Eliminar jugador</button>
        )}
      </div>
    </div>
  );
}import Campo from "./Campo.jsx";

const POSICIONES = ["Base", "Escolta", "Alero", "Ala-Pívot", "Pívot"];

export default function TabEditar({ form, onChange, onGuardar, onEliminar, perfil }) {
  return (
    <div className="form-stack">
      <Campo label="Nombre">
        <input type="text" value={form.nombre ?? ""} onChange={(e) => onChange({ ...form, nombre: e.target.value })} placeholder="Carlos" />
      </Campo>
      <Campo label="Apellido">
        <input type="text" value={form.apellido ?? ""} onChange={(e) => onChange({ ...form, apellido: e.target.value })} placeholder="García" />
      </Campo>
      <Campo label="Posición">
        <select value={form.posicion ?? ""} onChange={(e) => onChange({ ...form, posicion: e.target.value })}>
          <option value="">Sin posición</option>
          {POSICIONES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </Campo>
      <div className="btn-row">
        <button className="btn-primary" onClick={onGuardar}>Guardar cambios</button>
        {perfil?.rol === "admin" && (
          <button className="btn-danger" onClick={onEliminar}>Eliminar jugador</button>
        )}
      </div>
    </div>
  );
}