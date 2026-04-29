import { useState, useEffect } from "react";

function normalizarIdsEquipo(perfil) {
  const ids = [];
  if (Array.isArray(perfil?.equipo_ids)) {
    ids.push(...perfil.equipo_ids.filter(Boolean));
  } else if (
    typeof perfil?.equipo_ids === "string" &&
    perfil.equipo_ids.trim()
  ) {
    const raw = perfil.equipo_ids.trim();
    if (raw.startsWith("{") && raw.endsWith("}")) {
      ids.push(
        ...raw
          .slice(1, -1)
          .split(",")
          .map((x) => x.trim().replace(/^"|"$/g, ""))
          .filter(Boolean),
      );
    } else {
      ids.push(raw);
    }
  }
  if (perfil?.equipo_id) ids.push(perfil.equipo_id);
  return [...new Set(ids)];
}

export default function AdminEquipos({
  supabase,
  perfil,
  temporada,
  onSelect,
  onBack,
}) {
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        let query = supabase
          .from("equipos")
          .select(
            `
            id, sponsor, categoria_id, competicion_id, temporada_id,
            categorias (nombre),
            competiciones (nombre),
            temporadas (nombre)
          `,
          )
          .eq("temporada_id", temporada.id)
          .order("sponsor", { ascending: true, nullsFirst: false });

        // Si no es admin, filtrar por los equipos del perfil
        if (perfil?.rol !== "admin") {
          const ids = normalizarIdsEquipo(perfil);
          if (ids.length) {
            query = query.in("id", ids);
          } else {
            setEquipos([]);
            setCargando(false);
            return;
          }
        }

        const { data, error } = await query;
        if (error) throw error;
        setEquipos(data ?? []);
      } catch (e) {
        console.error("Error cargando equipos:", e);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [temporada.id, perfil]);

  if (cargando)
    return <p style={{ color: "var(--muted)" }}>Cargando equipos...</p>;

  return (
    <div>
      <button onClick={onBack} className="adm-back-btn">
        ← Volver
      </button>
      <h1 className="adm-page-title">Equipos</h1>
      <p className="adm-page-subtitle">
        Temporada {temporada.nombre} · Selecciona un equipo
      </p>

      <div className="adm-list" style={{ maxWidth: "500px", gap: "10px" }}>
        {equipos.length === 0 && (
          <p className="adm-empty">No hay equipos en esta temporada.</p>
        )}
        {equipos.map((e) => (
          <div
            key={e.id}
            onClick={() => onSelect(e)}
            className="card adm-card-row adm-card-clickable"
          >
            <div>
              <div className="adm-card-title">
                {e.sponsor ?? e.categorias?.nombre ?? "Equipo"}
              </div>
              <div className="adm-card-subtitle">
                {e.categorias?.nombre ?? "Sin categoría"}
              </div>
            </div>
            <span className="adm-pill adm-pill--muted">
              {e.competiciones?.nombre ?? "Sin competición"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
