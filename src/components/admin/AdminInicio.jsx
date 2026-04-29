// import { useState, useEffect } from "react";
// function normalizarIdsEquipo(perfil) {
//   const ids = [];

//   if (Array.isArray(perfil?.equipo_ids)) {
//     ids.push(...perfil.equipo_ids.filter(Boolean));
//   } else if (
//     typeof perfil?.equipo_ids === "string" &&
//     perfil.equipo_ids.trim()
//   ) {
//     const raw = perfil.equipo_ids.trim();
//     if (raw.startsWith("{") && raw.endsWith("}")) {
//       ids.push(
//         ...raw
//           .slice(1, -1)
//           .split(",")
//           .map((x) => x.trim().replace(/^"|"$/g, ""))
//           .filter(Boolean),
//       );
//     } else {
//       ids.push(raw);
//     }
//   }

//   if (perfil?.equipo_id) {
//     ids.push(perfil.equipo_id);
//   }

//   return [...new Set(ids)];
// }

// export default function AdminInicio({
//   supabase,
//   perfil,
//   onIrAEquipos,
//   onSelectEquipo,
// }) {
//   const [stats, setStats] = useState({ partidos: 0, victorias: 0 });
//   const [equipos, setEquipos] = useState([]);
//   const [cargando, setCargando] = useState(true);

//   useEffect(() => {
//     async function cargar() {
//       let equiposData = [];
//       if (perfil?.rol === "admin") {
//         const { data, error } = await supabase
//           .from("equipos")
//           .select("id, sponsor, categoria_id, competicion_id, temporada_id")
//           .order("sponsor", { ascending: true, nullsFirst: false });
//         if (error) {
//           console.error("Error cargando equipos admin:", error);
//         }
//         equiposData = data ?? [];
//       } else {
//         const ids = normalizarIdsEquipo(perfil);
//         if (ids.length) {
//           const { data, error } = await supabase
//             .from("equipos")
//             .select("id, sponsor, categoria_id, competicion_id, temporada_id")
//             .in("id", ids);
//           if (error) {
//             console.error("Error cargando equipos de perfil:", error);
//           }
//           equiposData = data ?? [];
//         }
//       }

//       const categoriaIds = [
//         ...new Set(equiposData.map((e) => e.categoria_id).filter(Boolean)),
//       ];
//       const competicionIds = [
//         ...new Set(equiposData.map((e) => e.competicion_id).filter(Boolean)),
//       ];
//       const temporadaIds = [
//         ...new Set(equiposData.map((e) => e.temporada_id).filter(Boolean)),
//       ];

//       const [catsRes, compsRes, tempsRes] = await Promise.all([
//         categoriaIds.length
//           ? supabase
//               .from("categorias")
//               .select("id, nombre")
//               .in("id", categoriaIds)
//           : Promise.resolve({ data: [], error: null }),
//         competicionIds.length
//           ? supabase
//               .from("competiciones")
//               .select("id, nombre")
//               .in("id", competicionIds)
//           : Promise.resolve({ data: [], error: null }),
//         temporadaIds.length
//           ? supabase
//               .from("temporadas")
//               .select("id, nombre")
//               .in("id", temporadaIds)
//           : Promise.resolve({ data: [], error: null }),
//       ]);

//       if (catsRes.error) {
//         console.warn(
//           "No se pudieron cargar categorías para inicio admin:",
//           catsRes.error,
//         );
//       }
//       if (compsRes.error) {
//         console.warn(
//           "No se pudieron cargar competiciones para inicio admin:",
//           compsRes.error,
//         );
//       }
//       if (tempsRes.error) {
//         console.warn(
//           "No se pudieron cargar temporadas para inicio admin:",
//           tempsRes.error,
//         );
//       }

//       const mapCats = new Map(
//         (catsRes.data ?? []).map((c) => [c.id, c.nombre]),
//       );
//       const mapComps = new Map(
//         (compsRes.data ?? []).map((c) => [c.id, c.nombre]),
//       );
//       const mapTemps = new Map(
//         (tempsRes.data ?? []).map((t) => [t.id, t.nombre]),
//       );

//       setEquipos(
//         equiposData.map((e) => ({
//           ...e,
//           categorias: { nombre: mapCats.get(e.categoria_id) ?? null },
//           competiciones: { nombre: mapComps.get(e.competicion_id) ?? null },
//           temporadas: { nombre: mapTemps.get(e.temporada_id) ?? null },
//         })),
//       );

//       const { data: partidos } = await supabase
//         .from("partidos")
//         .select("puntos_favor, puntos_contra")
//         .not("puntos_favor", "is", null);

//       const total = partidos?.length ?? 0;
//       const victorias =
//         partidos?.filter((p) => p.puntos_favor > p.puntos_contra).length ?? 0;
//       setStats({ partidos: total, victorias });
//       setCargando(false);
//     }
//     if (perfil) cargar();
//   }, [perfil]);

//   if (cargando) return <p style={{ color: "var(--muted)" }}>Cargando...</p>;

//   return (
//     <div>
//       <div
//         style={{
//           background: "#0f172a",
//           borderRadius: "12px",
//           padding: "24px",
//           marginBottom: "24px",
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <div>
//           <h1
//             style={{
//               fontSize: "20px",
//               fontWeight: 800,
//               color: "white",
//               marginBottom: "4px",
//             }}
//           >
//             Bienvenido, {perfil?.nombre ?? "Admin"}
//           </h1>
//           <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
//             Temporada 2025-26
//           </p>
//         </div>
//         <div style={{ display: "flex", gap: "24px" }}>
//           {[
//             { num: stats.partidos, label: "Partidos" },
//             { num: stats.victorias, label: "Victorias" },
//             { num: stats.partidos - stats.victorias, label: "Derrotas" },
//           ].map((s) => (
//             <div key={s.label} style={{ textAlign: "center" }}>
//               <div
//                 style={{ fontSize: "24px", fontWeight: 800, color: "#F97316" }}
//               >
//                 {s.num}
//               </div>
//               <div
//                 style={{
//                   fontSize: "10px",
//                   color: "rgba(255,255,255,0.4)",
//                   textTransform: "uppercase",
//                   letterSpacing: ".05em",
//                 }}
//               >
//                 {s.label}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div
//         style={{
//           fontSize: "11px",
//           fontWeight: 700,
//           textTransform: "uppercase",
//           letterSpacing: ".08em",
//           color: "#F97316",
//           marginBottom: "12px",
//         }}
//       >
//         Mis equipos
//       </div>

//       <div
//         style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(2, 1fr)",
//           gap: "10px",
//           marginBottom: "24px",
//         }}
//       >
//         {equipos.map((e) => (
//           <div
//             key={e.id}
//             onClick={() =>
//               onSelectEquipo(
//                 {
//                   id: e.id,
//                   sponsor: e.sponsor,
//                   categoria_id: e.categoria_id,
//                   competicion_id: e.competicion_id,
//                   categorias: e.categorias,
//                   competiciones: e.competiciones,
//                 },
//                 {
//                   temporadas: {
//                     id: e.temporada_id,
//                     nombre: e.temporadas?.nombre,
//                   },
//                 },
//               )
//             }
//             className="card"
//             style={{ cursor: "pointer" }}
//           >
//             <div
//               style={{ fontWeight: 700, fontSize: "14px", marginBottom: "3px" }}
//             >
//               {e.sponsor ?? e.categorias?.nombre ?? "Equipo"}
//             </div>
//             <div style={{ fontSize: "12px", color: "var(--muted)" }}>
//               {e.categorias?.nombre ?? "Sin categoría"} ·{" "}
//               {e.temporadas?.nombre ?? "Sin temporada"}
//             </div>
//             <span
//               style={{
//                 display: "inline-block",
//                 marginTop: "8px",
//                 fontSize: "10px",
//                 padding: "2px 8px",
//                 borderRadius: "20px",
//                 fontWeight: 700,
//                 background: "#eff6ff",
//                 color: "#1d4ed8",
//               }}
//             >
//               {e.competiciones?.nombre ?? "Sin competición"}
//             </span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
