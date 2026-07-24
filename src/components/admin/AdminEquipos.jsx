import { useState, useEffect } from "react";

const ORDEN_CATEGORIAS = [
  "sénior masculino",
  "sénior femenino",
  "junior masculino",
  "junior femenino",
  "cadete masculino",
  "cadete femenino",
  "infantil masculino",
  "infantil femenino",
  "alevín masculino",
  "alevín femenino",
  "benjamín masculino",
  "benjamín femenino",
  "prebenjamín masculino",
  "prebenjamín femenino",
];

function ordenCategoria(nombre) {
  if (!nombre) return 999;
  const norm = nombre.toLowerCase().trim();
  const exacto = ORDEN_CATEGORIAS.indexOf(norm);
  if (exacto !== -1) return exacto;
  const bases = [
    "senior",
    "junior",
    "cadete",
    "infantil",
    "alevín",
    "benjamín",
    "prebenjamín",
  ];
  for (let i = 0; i < bases.length; i++) {
    if (norm.startsWith(bases[i]))
      return i * 10 + (norm.includes("femenino") ? 1 : 0);
  }
  return 999;
}

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

// Une los nombres de todas las competiciones de un equipo en un string legible
function nombresCompeticiones(equipo) {
  const nombres = (equipo.equipo_competiciones ?? [])
    .map((ec) => ec.competiciones?.nombre)
    .filter(Boolean);
  return nombres.length > 0 ? nombres.join(", ") : "Sin competición";
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
        // Eliminado .order("sponsor") para evitar el fallo de columna inexistente
        let query = supabase
          .from("equipos")
          .select(
            `
              id,
              foto_url,
              sponsor_id,
              categoria_id,
              temporada_id,
              categorias (nombre),
              temporadas:temporadas!equipos_temporada_id_fkey (nombre),
              sponsors (
                id,
                nombre,
                logo_url
              ),
              equipo_competiciones (
                competicion_id,
                competiciones:competiciones!equipo_competiciones_competicion_id_fkey (id, nombre)
              )
            `,
          )
          .eq("temporada_id", temporada.id);

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

        // Ordenamos en memoria: primero por el orden de la categoría, y en caso de empate, por el nombre del sponsor relacionado
        const ordenados = (data ?? []).sort((a, b) => {
          const oa = ordenCategoria(a.categorias?.nombre);
          const ob = ordenCategoria(b.categorias?.nombre);
          if (oa !== ob) return oa - ob;
          const sa = a.sponsors?.nombre ?? "";
          const sb = b.sponsors?.nombre ?? "";
          return sa.localeCompare(sb, "es");
        });

        setEquipos(ordenados);
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
                {e.sponsors?.nombre ?? e.categorias?.nombre ?? "Equipo"}
              </div>
              <div className="adm-card-subtitle">
                {e.categorias?.nombre ?? "Sin categoría"}
              </div>
            </div>
            <span className="adm-pill adm-pill--muted">
              {nombresCompeticiones(e)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
