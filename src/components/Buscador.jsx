// src/components/Buscador.jsx
import { useState, useEffect, useRef, useCallback } from "react";

const COLOR_TIPO = {
  jugador: "var(--azul)",
  equipo: "var(--naranja)",
  noticia: "var(--muted)",
};

const ETIQUETAS = {
  jugador: "Jugadores",
  equipo: "Equipos",
  noticia: "Noticias",
};

const ICONOS = {
  jugador: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  equipo: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 6.36 15.36M5.64 5.64A9 9 0 0 1 12 3" />
      <path d="M3 12h18M12 3c-2 2.5-3 5-3 9s1 6.5 3 9M12 3c2 2.5 3 5 3 9s-1 6.5-3 9" />
    </svg>
  ),
  noticia: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z" />
      <path d="M8 9h8M8 13h5" />
    </svg>
  ),
};

export default function Buscador() {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [expandido, setExpandido] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(-1);
  const [cargado, setCargado] = useState(false);
  const fuseRef = useRef(null);
  const inputRef = useRef(null);
  const contenedorRef = useRef(null);
  // Carga el índice + Fuse dinámicamente
  useEffect(() => {
    Promise.all([
      fetch("/search-index.json").then((r) => r.json()),
      import("fuse.js").then((m) => m.default),
    ]).then(([items, Fuse]) => {
      fuseRef.current = new Fuse(items, {
        keys: ["titulo", "subtitulo"],
        threshold: 0.35,
        includeScore: true,
      });
      setCargado(true);
    });
  }, []);

  useEffect(() => {
    function handler(e) {
      if (!contenedorRef.current?.contains(e.target)) {
        setAbierto(false);
        setExpandido(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Búsqueda reactiva
  useEffect(() => {
    if (!fuseRef.current || query.trim().length < 2) {
      setResultados([]);
      setAbierto(false);
      return;
    }
    const res = fuseRef.current
      .search(query.trim())
      .slice(0, 8)
      .map((r) => r.item);
    setResultados(res);
    setAbierto(res.length > 0);
    setIndiceActivo(-1);
  }, [query]);

  // Cierra al clicar fuera
  useEffect(() => {
    function handler(e) {
      if (!contenedorRef.current?.contains(e.target)) setAbierto(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Ctrl+K / Cmd+K
  useEffect(() => {
    function handler(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const navegar = useCallback((url) => {
    setQuery("");
    setAbierto(false);
    window.location.href = url;
  }, []);

  function onKeyDown(e) {
    if (!abierto) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceActivo((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceActivo((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && indiceActivo >= 0) {
      navegar(resultados[indiceActivo].url);
    } else if (e.key === "Escape") {
      setAbierto(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={contenedorRef} style={{ position: "relative" }}>
      {/* ── Barra ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: expandido ? "var(--card)" : "transparent",
          border: expandido
            ? "1.5px solid var(--borde)"
            : "1.5px solid transparent",
          borderRadius: "8px",
          transition: "all .2s ease",
          overflow: "hidden",
          width: expandido ? "260px" : "34px",
        }}
      >
        {/* Icono lupa / botón */}
        <button
          onClick={() => {
            setExpandido(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "var(--muted)",
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </button>

        {/* Input — solo visible cuando expandido */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Buscar…"
          style={{
            width: expandido ? "100%" : "0",
            padding: expandido ? "8px 8px 8px 0" : "0",
            fontSize: "13px",
            background: "transparent",
            border: "none",
            color: "var(--texto)",
            outline: "none",
            opacity: expandido ? 1 : 0,
            transition: "opacity .15s",
          }}
        />
        {/* Botón cerrar — solo cuando expandido */}
        {expandido && (
          <button
            onClick={() => {
              setQuery("");
              setAbierto(false);
              setExpandido(false);
            }}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              color: "var(--muted)",
              flexShrink: 0,
              fontSize: "14px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>
      {/* ── Dropdown ── */}
      {abierto && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "var(--card)",
            border: "1.5px solid var(--borde)",
            borderRadius: "12px",
            boxShadow: "0 12px 32px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06)",
            zIndex: 999,
            overflow: "hidden",
            minWidth: "300px",
          }}
        >
          {["jugador", "equipo", "noticia"].map((tipo) => {
            const grupo = resultados.filter((r) => r.tipo === tipo);
            if (!grupo.length) return null;
            return (
              <div key={tipo}>
                {/* Cabecera de grupo */}
                <div
                  style={{
                    padding: "8px 12px 4px",
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                    color: COLOR_TIPO[tipo],
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span style={{ opacity: 0.7 }}>{ICONOS[tipo]}</span>
                  {ETIQUETAS[tipo]}
                </div>

                {grupo.map((item) => {
                  const idx = resultados.indexOf(item);
                  const activo = idx === indiceActivo;
                  return (
                    <div
                      key={item.id}
                      onClick={() => navegar(item.url)}
                      onMouseEnter={() => setIndiceActivo(idx)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "7px 12px",
                        cursor: "pointer",
                        background: activo
                          ? "var(--color-background-secondary)"
                          : "transparent",
                        borderLeft: activo
                          ? `3px solid var(--naranja)`
                          : "3px solid transparent",
                        transition: "background .1s, border-color .1s",
                      }}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "8px",
                          background: "var(--color-background-secondary)",
                          border: "1px solid var(--borde)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          overflow: "hidden",
                          color: COLOR_TIPO[tipo],
                        }}
                      >
                        {item.imagen ? (
                          <img
                            src={item.imagen}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          ICONOS[tipo]
                        )}
                      </div>

                      {/* Texto */}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            color: "var(--texto)",
                          }}
                        >
                          {item.titulo}
                        </div>
                        {item.subtitulo && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--muted)",
                              marginTop: "1px",
                            }}
                          >
                            {item.subtitulo}
                          </div>
                        )}
                      </div>

                      {/* Flecha */}
                      {activo && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--naranja)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ flexShrink: 0 }}
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Pie */}
          <div
            style={{
              padding: "6px 12px",
              borderTop: "1px solid var(--borde)",
              display: "flex",
              gap: "12px",
              fontSize: "10px",
              color: "var(--muted)",
            }}
          >
            <span>↑↓ navegar</span>
            <span>↵ abrir</span>
            <span>esc cerrar</span>
          </div>
        </div>
      )}
    </div>
  );
}
