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
      <h1 className="adm-page-title">Panel de administración</h1>
      <p className="adm-page-subtitle">Introduce tus credenciales</p>

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
          <label className="adm-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="adm-input"
          />
        </div>
        <div>
          <label className="adm-label">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="adm-input"
          />
        </div>
        {error && <p style={{ color: "red", fontSize: "13px", margin: 0 }}>{error}</p>}
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
