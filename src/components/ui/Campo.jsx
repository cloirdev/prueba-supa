export default function Campo({ label, children }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label
        style={{
          fontSize: "12px",
          fontWeight: 700,
          display: "block",
          marginBottom: "5px",
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: ".05em",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
