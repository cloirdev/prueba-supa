import { useState } from "react";

export default function AdminLogin({ supabase }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError("Rellena todos los campos");
      return;
    }
    setCargando(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (err) {
      setError("Email o contraseña incorrectos");
      setCargando(false);
    }
  }

  return (
    <div style={{ maxWidth: "400px", margin: "80px auto", padding: "0 24px" }}>
      <h1 style={{ marginBottom: "4px" }}>Panel de administración</h1>
      <p
        style={{
          color: "var(--muted)",
          fontSize: "14px",
          marginBottom: "32px",
        }}
      >
        Introduce tus credenciales
      </p>

      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--borde)",
          borderRadius: "10px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
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
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
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
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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
        {error && (
          <p style={{ color: "red", fontSize: "13px", margin: 0 }}>{error}</p>
        )}
        <button
          onClick={handleLogin}
          disabled={cargando}
          style={{
            background: "var(--naranja)",
            color: "white",
            border: "none",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            opacity: cargando ? 0.7 : 1,
          }}
        >
          {cargando ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
}
