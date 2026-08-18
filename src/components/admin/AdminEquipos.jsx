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

// Select reutilizado tanto en la carga de la lista como en el refetch
// puntual al seleccionar un equipo, para que ambos devuelvan la misma forma.
const SELECT_EQUIPO = `
  id,
  foto_url,
  sponsor_id,
  categoria_id,
  temporada_id,
  categorias (id, nombre, genero),
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
`;

export default function AdminEquipos({
  supabase,
  perfil,
  temporada,
  onSelect,
  onBack,
  embedded = false,
}) {
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vistaCards, setVistaCards] = useState(false);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      try {
        // Eliminado .order("sponsor") para evitar el fallo de columna inexistente
        let query = supabase
          .from("equipos")
          .select(SELECT_EQUIPO)
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
    if (temporada?.id) cargar();
  }, [temporada?.id, perfil]);

  // Al entrar a un equipo, pedimos su fila fresca en vez de reenviar el
  // objeto que quedó cacheado en `equipos` — así AdminPanel siempre arranca
  // con foto_url/sponsor actuales, aunque esta lista no se haya recargado
  // desde la última visita (p. ej. al volver con onBack sin desmontar este
  // componente).
  async function seleccionarEquipo(equipoBase) {
    const { data, error } = await supabase
      .from("equipos")
      .select(SELECT_EQUIPO)
      .eq("id", equipoBase.id)
      .single();

    if (error) {
      console.error("Error refrescando equipo:", error);
      onSelect(equipoBase);
      return;
    }
    onSelect(data);
  }

  if (cargando && equipos.length === 0)
    return <p style={{ color: "var(--muted)" }}>Cargando equipos...</p>;

  return (
    <div
      style={{ opacity: cargando ? 0.5 : 1, transition: "opacity 0.15s ease" }}
    >
      {!embedded && (
        <>
          <button onClick={onBack} className="adm-back-btn">
            ← Volver
          </button>
          <h1 className="adm-page-title">Equipos</h1>
          <p className="adm-page-subtitle">
            Temporada {temporada.nombre} · Selecciona un equipo
          </p>
        </>
      )}

      <div style={{ marginBottom: "16px" }}>
        <div
          onClick={() => setVistaCards(!vistaCards)}
          style={{
            display: "flex",
            alignItems: "center",
            background: "var(--card)",
            border: "1px solid var(--borde)",
            borderRadius: "12px",
            padding: "4px",
            width: "fit-content",
            cursor: "pointer",
            position: "relative",
            userSelect: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "4px",
              left: vistaCards ? "calc(50%)" : "4px",
              width: "calc(50% - 4px)",
              height: "calc(100% - 8px)",
              background: "var(--naranja)",
              borderRadius: "8px",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              zIndex: 0,
            }}
          />
          <div
            style={{
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              zIndex: 1,
              color: !vistaCards ? "white" : "var(--muted)",
              fontSize: "14px",
              fontWeight: 700,
              transition: "color 0.2s",
            }}
          >
            ☰
          </div>
          <div
            style={{
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              zIndex: 1,
              color: vistaCards ? "white" : "var(--muted)",
              fontSize: "14px",
              fontWeight: 700,
              transition: "color 0.2s",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 512 512"
            >
              <path d="M0 0h512v512H0z" fill="none" />
              <path
                fill="currentColor"
                d="M240 240H32V32h208Zm240 0H272V32h208ZM240 480H32V272h208Zm240 0H272V272h208Z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div
        className="adm-list"
        style={{
          maxWidth: vistaCards ? "none" : embedded ? undefined : "500px",
          gap: "10px",
          display: "flex",
          flexDirection: vistaCards ? "row" : "column",
          flexWrap: vistaCards ? "wrap" : "nowrap",
        }}
      >
        {equipos.length === 0 && !cargando && (
          <p className="adm-empty">No hay equipos en esta temporada.</p>
        )}
        {equipos.map((e) => (
          <div
            key={e.id}
            onClick={() => seleccionarEquipo(e)}
            className="card adm-card-row adm-card-clickable"
            style={
              vistaCards
                ? {
                    width: "calc(25% - 8px)",
                    minWidth: "160px",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    textAlign: "left",
                  }
                : undefined
            }
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
