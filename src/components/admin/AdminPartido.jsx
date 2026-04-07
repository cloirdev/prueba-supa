import { useState, useEffect } from "react";

export default function AdminPartido({
  supabase,
  perfil,
  equipo,
  temporada,
  partido,
  onBack,
}) {
  const [seccion, setSeccion] = useState("resultado");
  const [resultado, setResultado] = useState({
    puntos_favor: partido.puntos_favor ?? "",
    puntos_contra: partido.puntos_contra ?? "",
  });
  const [cronica, setCronica] = useState("");
  const [jugadores, setJugadores] = useState([]);
  const [stats, setStats] = useState({});
  const [fotos, setFotos] = useState([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    const [
      { data: conv },
      { data: cronData },
      { data: fotosData },
      { data: statsData },
    ] = await Promise.all([
      supabase
        .from("convocatorias_temporada")
        .select("dorsal, jugadores (id, nombre, apellido, posicion)")
        .eq("equipo_id", equipo.id)
        .eq("temporada_id", temporada.temporadas.id)
        .order("dorsal"),
      supabase
        .from("cronicas")
        .select("*")
        .eq("partido_id", partido.id)
        .single(),
      supabase.from("fotos").select("*").eq("partido_id", partido.id),
      supabase
        .from("convocatorias_partido")
        .select("*")
        .eq("partido_id", partido.id),
    ]);

    setJugadores(conv ?? []);
    if (cronData) setCronica(cronData.contenido ?? "");
    const statsMap = {};
    statsData?.forEach((s) => {
      statsMap[s.jugador_id] = s;
    });
    setStats(statsMap);
    setFotos(fotosData ?? []);
    setCargando(false);
  }

  async function guardarResultado() {
    setError("");
    setMsg("");
    const { error: err } = await supabase
      .from("partidos")
      .update({
        puntos_favor: parseInt(resultado.puntos_favor),
        puntos_contra: parseInt(resultado.puntos_contra),
      })
      .eq("id", partido.id);
    if (err) {
      setError("Error al guardar resultado");
      return;
    }
    setMsg("Resultado guardado");
  }

  async function guardarCronica() {
    setError("");
    setMsg("");
    const { data: existing } = await supabase
      .from("cronicas")
      .select("id")
      .eq("partido_id", partido.id)
      .single();
    if (existing) {
      await supabase
        .from("cronicas")
        .update({ contenido: cronica, publicada: false })
        .eq("id", existing.id);
    } else {
      await supabase.from("cronicas").insert({
        partido_id: partido.id,
        contenido: cronica,
        publicada: false,
      });
    }
    setMsg("Crónica guardada como borrador");
  }

  async function publicarCronica() {
    setError("");
    setMsg("");
    const { data: existing } = await supabase
      .from("cronicas")
      .select("id")
      .eq("partido_id", partido.id)
      .single();
    if (existing) {
      await supabase
        .from("cronicas")
        .update({ contenido: cronica, publicada: true })
        .eq("id", existing.id);
    } else {
      await supabase.from("cronicas").insert({
        partido_id: partido.id,
        contenido: cronica,
        publicada: true,
      });
    }
    setMsg("Crónica publicada");
  }

  async function guardarStats(jugadorId) {
    const s = stats[jugadorId] ?? {};
    const { data: existing } = await supabase
      .from("convocatorias_partido")
      .select("id")
      .eq("partido_id", partido.id)
      .eq("jugador_id", jugadorId)
      .single();

    const payload = {
      partido_id: partido.id,
      jugador_id: jugadorId,
      equipo_id: equipo.id,
      titular: s.titular ?? false,
      minutos: parseInt(s.minutos ?? 0),
      puntos: parseInt(s.puntos ?? 0),
      triples_intentados: parseInt(s.triples_intentados ?? 0),
      triples_anotados: parseInt(s.triples_anotados ?? 0),
      tiros_campo_intentados: parseInt(s.tiros_campo_intentados ?? 0),
      tiros_campo_anotados: parseInt(s.tiros_campo_anotados ?? 0),
      tiros_libres_intentados: parseInt(s.tiros_libres_intentados ?? 0),
      tiros_libres_anotados: parseInt(s.tiros_libres_anotados ?? 0),
      rebotes_ofensivos: parseInt(s.rebotes_ofensivos ?? 0),
      rebotes_defensivos: parseInt(s.rebotes_defensivos ?? 0),
      asistencias: parseInt(s.asistencias ?? 0),
      robos: parseInt(s.robos ?? 0),
      tapones: parseInt(s.tapones ?? 0),
      perdidas: parseInt(s.perdidas ?? 0),
      faltas_cometidas: parseInt(s.faltas_cometidas ?? 0),
      mas_menos: parseInt(s.mas_menos ?? 0),
    };

    if (existing) {
      await supabase
        .from("convocatorias_partido")
        .update(payload)
        .eq("id", existing.id);
    } else {
      await supabase.from("convocatorias_partido").insert(payload);
    }
  }

  async function subirFoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const nombre = `${partido.id}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error: err } = await supabase.storage
      .from("partidos")
      .upload(nombre, file);
    if (err) {
      setError("Error al subir foto");
      return;
    }
    const { data: urlData } = supabase.storage
      .from("partidos")
      .getPublicUrl(nombre);
    await supabase
      .from("fotos")
      .insert({ partido_id: partido.id, url: urlData.publicUrl });
    setMsg("Foto subida correctamente");
    cargar();
  }

  async function eliminarFoto(foto) {
    const nombre = foto.url.split("/").pop();
    await supabase.storage.from("partidos").remove([nombre]);
    await supabase.from("fotos").delete().eq("id", foto.id);
    cargar();
  }

  function FilaJugador({ c }) {
    const s = stats[c.jugadores.id] ?? {};
    const rt =
      parseInt(s.rebotes_ofensivos ?? 0) + parseInt(s.rebotes_defensivos ?? 0);
    const esTitular = s.titular ?? false;

    const celda = (campo, width = "38px") => (
      <td style={{ padding: "6px 8px", textAlign: "center" }}>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={s[campo] ?? ""}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9-]/g, "");
            setStats({ ...stats, [c.jugadores.id]: { ...s, [campo]: val } });
          }}
          style={{
            width,
            padding: "4px",
            borderRadius: "4px",
            border: "none",
            borderBottom: "1px solid var(--borde)",
            background: "transparent",
            color: "var(--texto)",
            fontSize: "13px",
            textAlign: "center",
          }}
        />
      </td>
    );

    const celdaTiro = (an, int_) => (
      <td style={{ padding: "6px 8px", textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1px",
            justifyContent: "center",
          }}
        >
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={s[an] ?? ""}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, "");
              setStats({ ...stats, [c.jugadores.id]: { ...s, [an]: val } });
            }}
            style={{
              width: "26px",
              padding: "4px 2px",
              borderRadius: "4px",
              border: "none",
              borderBottom: "1px solid var(--borde)",
              background: "transparent",
              color: "var(--texto)",
              fontSize: "13px",
              textAlign: "center",
            }}
          />
          <span style={{ color: "var(--muted)", fontSize: "12px" }}>-</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={s[int_] ?? ""}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, "");
              setStats({ ...stats, [c.jugadores.id]: { ...s, [int_]: val } });
            }}
            style={{
              width: "26px",
              padding: "4px 2px",
              borderRadius: "4px",
              border: "none",
              borderBottom: "1px solid var(--borde)",
              background: "transparent",
              color: "var(--texto)",
              fontSize: "13px",
              textAlign: "center",
            }}
          />
        </div>
      </td>
    );
    return (
      <tr style={{ borderBottom: "0.5px solid var(--borde)" }}>
        <td style={{ padding: "10px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              onClick={() =>
                setStats({
                  ...stats,
                  [c.jugadores.id]: { ...s, titular: !esTitular },
                })
              }
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: esTitular ? "#1e3a5f" : "transparent",
                border: esTitular ? "none" : "1px solid var(--borde)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 800,
                color: esTitular ? "#F97316" : "var(--muted)",
                flexShrink: 0,
                cursor: "pointer",
              }}
              title="Click para cambiar titular/suplente"
            >
              {c.dorsal}
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: "13px" }}>
                {c.jugadores.nombre[0]}. {c.jugadores.apellido}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  color: "var(--muted)",
                  marginLeft: "6px",
                }}
              >
                {c.jugadores.posicion[0]}
              </span>
            </div>
          </div>
        </td>
        {celda("minutos", "36px")}
        {celda("puntos", "36px")}
        {celdaTiro("tiros_campo_anotados", "tiros_campo_intentados")}
        {celdaTiro("triples_anotados", "triples_intentados")}
        <td
          style={{
            padding: "6px 8px",
            textAlign: "center",
            fontWeight: 700,
            fontSize: "13px",
          }}
        >
          {rt || "0"}
        </td>
        {celda("asistencias", "36px")}
        {celda("faltas_cometidas", "36px")}
        {celdaTiro("tiros_libres_anotados", "tiros_libres_intentados")}
        {celda("rebotes_ofensivos", "36px")}
        {celda("rebotes_defensivos", "36px")}
        {celda("robos", "36px")}
        {celda("tapones", "36px")}
      </tr>
    );
  }

  function FilaTotales({ lista }) {
    const sum = (campo) =>
      lista.reduce(
        (a, c) => a + parseInt(stats[c.jugadores.id]?.[campo] ?? 0),
        0,
      );
    const style = {
      padding: "8px 8px",
      textAlign: "center",
      fontWeight: 700,
      fontSize: "12px",
      color: "var(--muted)",
    };
    return (
      <tr
        style={{
          borderBottom: "2px solid var(--texto)",
          background: "var(--fondo)",
        }}
      >
        <td
          style={{
            padding: "8px",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--muted)",
          }}
        ></td>
        <td style={style}>{sum("minutos")}</td>
        <td style={{ ...style, color: "#F97316" }}>{sum("puntos")}</td>
        <td style={style}>
          {sum("tiros_campo_anotados")}-{sum("tiros_campo_intentados")}
        </td>
        <td style={style}>
          {sum("triples_anotados")}-{sum("triples_intentados")}
        </td>
        <td style={style}>
          {sum("rebotes_ofensivos") + sum("rebotes_defensivos")}
        </td>
        <td style={style}>{sum("asistencias")}</td>
        <td style={style}>{sum("faltas_cometidas")}</td>
        <td style={style}>
          {sum("tiros_libres_anotados")}-{sum("tiros_libres_intentados")}
        </td>
        <td style={style}>{sum("rebotes_ofensivos")}</td>
        <td style={style}>{sum("rebotes_defensivos")}</td>
        <td style={style}>{sum("robos")}</td>
        <td style={style}>{sum("tapones")}</td>
      </tr>
    );
  }

  const HEADERS = [
    "MIN",
    "PTS",
    "FG",
    "3PT",
    "REB",
    "AST",
    "PF",
    "FT",
    "OREB",
    "DREB",
    "STL",
    "BLK",
  ];

  function CabeceraSeccion({ titulo }) {
    return (
      <>
        <tr>
          <td
            colSpan={13}
            style={{
              padding: "16px 8px 6px",
              fontWeight: 800,
              fontSize: "11px",
              letterSpacing: ".1em",
              color: "var(--texto)",
              borderBottom: "2px solid var(--texto)",
            }}
          >
            {titulo}
          </td>
        </tr>
        <tr style={{ borderBottom: "0.5px solid var(--borde)" }}>
          <th
            style={{
              textAlign: "left",
              padding: "8px",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--muted)",
              minWidth: "160px",
            }}
          ></th>
          {HEADERS.map((h) => (
            <th
              key={h}
              style={{
                padding: "8px",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--muted)",
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </>
    );
  }

  const titulares = jugadores.filter((c) => stats[c.jugadores.id]?.titular);
  const suplentes = jugadores.filter((c) => !stats[c.jugadores.id]?.titular);

  const secciones = ["resultado", "estadísticas", "crónica", "fotos"];
  const fechaFormateada = partido.fecha
    ? new Date(partido.fecha).toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "Sin fecha";

  if (cargando) return <p style={{ color: "var(--muted)" }}>Cargando...</p>;

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--muted)",
          cursor: "pointer",
          fontSize: "13px",
          marginBottom: "24px",
          padding: 0,
        }}
      >
        ← Volver
      </button>

      <h1 style={{ marginBottom: "4px" }}>
        {partido.es_local ? "vs" : "@"} {partido.rival}
      </h1>
      <p
        style={{
          color: "var(--muted)",
          fontSize: "14px",
          marginBottom: "24px",
        }}
      >
        {fechaFormateada} · J{partido.jornada} ·{" "}
        {partido.es_local ? "Local" : "Visitante"}
      </p>

      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        {secciones.map((s) => (
          <button
            key={s}
            onClick={() => {
              setSeccion(s);
              setMsg("");
              setError("");
            }}
            style={{
              padding: "7px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              background: seccion === s ? "var(--naranja)" : "transparent",
              color: seccion === s ? "white" : "var(--muted)",
              border: seccion === s ? "none" : "1px solid var(--borde)",
              textTransform: "capitalize",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {msg && (
        <p style={{ color: "green", fontSize: "13px", marginBottom: "16px" }}>
          {msg}
        </p>
      )}
      {error && (
        <p style={{ color: "red", fontSize: "13px", marginBottom: "16px" }}>
          {error}
        </p>
      )}

      {seccion === "resultado" && (
        <div
          className="card"
          style={{
            maxWidth: "400px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Puntos a favor
              </label>
              <input
                type="number"
                min="0"
                value={resultado.puntos_favor}
                onChange={(e) =>
                  setResultado({ ...resultado, puntos_favor: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--borde)",
                  background: "var(--fondo)",
                  color: "var(--texto)",
                  fontSize: "14px",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Puntos en contra
              </label>
              <input
                type="number"
                min="0"
                value={resultado.puntos_contra}
                onChange={(e) =>
                  setResultado({ ...resultado, puntos_contra: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--borde)",
                  background: "var(--fondo)",
                  color: "var(--texto)",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>
          <button
            onClick={guardarResultado}
            style={{
              background: "var(--naranja)",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Guardar resultado
          </button>
        </div>
      )}

      {seccion === "estadísticas" && (
        <div>
          <div
            style={{
              background: "#1e3a5f",
              borderRadius: "10px",
              padding: "16px 20px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{ fontSize: "13px", fontWeight: 700, color: "white" }}
              >
                {equipo.nombre} vs {partido.rival}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.5)",
                  marginTop: "2px",
                }}
              >
                Boxscore · J{partido.jornada}
              </div>
            </div>
            {partido.puntos_favor !== null && (
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#F97316",
                  }}
                >
                  {partido.puntos_favor} – {partido.puntos_contra}
                </div>
                <div
                  style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}
                >
                  {partido.puntos_favor > partido.puntos_contra
                    ? "Victoria"
                    : "Derrota"}
                </div>
              </div>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
                minWidth: "900px",
              }}
            >
              <tbody>
                <CabeceraSeccion titulo="TITULARES" />
                {titulares.map((c) => (
                  <FilaJugador key={c.jugadores.id} c={c} />
                ))}
                <FilaTotales lista={titulares} />

                <CabeceraSeccion titulo="SUPLENTES" />
                {suplentes.map((c) => (
                  <FilaJugador key={c.jugadores.id} c={c} />
                ))}
                <FilaTotales lista={suplentes} />

                <tr style={{ borderTop: "2px solid var(--texto)" }}>
                  <td
                    style={{
                      padding: "10px 8px",
                      fontWeight: 800,
                      fontSize: "12px",
                      letterSpacing: ".08em",
                    }}
                  >
                    TOTALES
                  </td>
                  {(() => {
                    const sum = (campo) =>
                      jugadores.reduce(
                        (a, c) =>
                          a + parseInt(stats[c.jugadores.id]?.[campo] ?? 0),
                        0,
                      );
                    const style = {
                      padding: "10px 8px",
                      textAlign: "center",
                      fontWeight: 800,
                    };
                    return (
                      <>
                        <td style={style}>{sum("minutos")}</td>
                        <td
                          style={{
                            ...style,
                            color: "#F97316",
                            fontSize: "15px",
                          }}
                        >
                          {sum("puntos")}
                        </td>
                        <td style={style}>
                          {sum("tiros_campo_anotados")}-
                          {sum("tiros_campo_intentados")}
                        </td>
                        <td style={style}>
                          {sum("triples_anotados")}-{sum("triples_intentados")}
                        </td>
                        <td style={style}>
                          {sum("rebotes_ofensivos") + sum("rebotes_defensivos")}
                        </td>
                        <td style={style}>{sum("asistencias")}</td>
                        <td style={style}>{sum("faltas_cometidas")}</td>
                        <td style={style}>
                          {sum("tiros_libres_anotados")}-
                          {sum("tiros_libres_intentados")}
                        </td>
                        <td style={style}>{sum("rebotes_ofensivos")}</td>
                        <td style={style}>{sum("rebotes_defensivos")}</td>
                        <td style={style}>{sum("robos")}</td>
                        <td style={style}>{sum("tapones")}</td>
                      </>
                    );
                  })()}
                </tr>
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: "16px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            {(() => {
              const totalMinutos = jugadores.reduce(
                (a, c) => a + parseInt(stats[c.jugadores.id]?.minutos ?? 0),
                0,
              );
              const totalTitulares = titulares.length;
              const minutosOk = totalMinutos === 200;
              const titularesOk = totalTitulares === 5;
              const todoOk = minutosOk && titularesOk;
              return (
                <>
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: minutosOk
                          ? "green"
                          : totalMinutos > 200
                            ? "red"
                            : "var(--muted)",
                      }}
                    >
                      {totalMinutos} / 200 min
                      {!minutosOk && (
                        <span style={{ fontWeight: 400, marginLeft: "6px" }}>
                          {200 - totalMinutos > 0
                            ? `(faltan ${200 - totalMinutos})`
                            : `(sobran ${totalMinutos - 200})`}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: titularesOk
                          ? "green"
                          : totalTitulares > 5
                            ? "red"
                            : "var(--muted)",
                      }}
                    >
                      {totalTitulares} / 5 titulares
                      {!titularesOk && (
                        <span style={{ fontWeight: 400, marginLeft: "6px" }}>
                          {totalTitulares > 5
                            ? `(${totalTitulares - 5} de más)`
                            : `(faltan ${5 - totalTitulares})`}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const errores = [];
                      if (!minutosOk)
                        errores.push(
                          `Los minutos suman ${totalMinutos} en lugar de 200`,
                        );
                      if (!titularesOk)
                        errores.push(
                          `Hay ${totalTitulares} titulares en lugar de 5`,
                        );
                      if (errores.length > 0) {
                        if (
                          !confirm(
                            `Atención:\n${errores.join("\n")}\n\n¿Guardar igualmente?`,
                          )
                        )
                          return;
                      }
                      await Promise.all(
                        jugadores.map((c) => guardarStats(c.jugadores.id)),
                      );
                      setMsg("Estadísticas guardadas correctamente");
                    }}
                    style={{
                      background: todoOk ? "var(--naranja)" : "var(--azul)",
                      color: "white",
                      border: "none",
                      padding: "10px 24px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {todoOk ? "Guardar estadísticas" : "Guardar igualmente"}
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {seccion === "crónica" && (
        <div
          className="card"
          style={{
            maxWidth: "700px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <textarea
            value={cronica}
            onChange={(e) => setCronica(e.target.value)}
            placeholder="Escribe la crónica del partido..."
            rows={12}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--borde)",
              background: "var(--fondo)",
              color: "var(--texto)",
              fontSize: "14px",
              lineHeight: 1.7,
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={guardarCronica}
              style={{
                background: "transparent",
                border: "1px solid var(--borde)",
                color: "var(--texto)",
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Guardar borrador
            </button>
            <button
              onClick={publicarCronica}
              style={{
                background: "var(--naranja)",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Publicar
            </button>
          </div>
        </div>
      )}

      {seccion === "fotos" && (
        <div>
          <div
            className="card"
            style={{ maxWidth: "400px", marginBottom: "20px" }}
          >
            <label
              style={{
                fontSize: "13px",
                fontWeight: 700,
                display: "block",
                marginBottom: "10px",
              }}
            >
              Subir foto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={subirFoto}
              style={{ fontSize: "13px", color: "var(--texto)" }}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
            }}
          >
            {fotos.map((f) => (
              <div
                key={f.id}
                style={{
                  position: "relative",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1px solid var(--borde)",
                }}
              >
                <img
                  src={f.url}
                  alt=""
                  style={{
                    width: "100%",
                    height: "140px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <button
                  onClick={() => eliminarFoto(f)}
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    background: "rgba(0,0,0,0.6)",
                    border: "none",
                    color: "white",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            {fotos.length === 0 && (
              <p style={{ color: "var(--muted)", gridColumn: "1/-1" }}>
                No hay fotos subidas.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
