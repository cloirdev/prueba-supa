export default function Campo({ label, children }) {
  return (
    <div className="campo">
      <label>{label}</label>
      {children}
    </div>
  );
}
