import { useRef, useState } from "react";

export default function SubirFoto({ label, previewUrl, onFileSelected }) {
  const inputRef = useRef(null);
  const [localPreview, setLocalPreview] = useState(null);

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalPreview(URL.createObjectURL(file));
    onFileSelected(file);
  }

  const mostrarPreview = localPreview ?? previewUrl;

  return (
    <div>
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
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {mostrarPreview ? (
          <img
            src={mostrarPreview}
            alt={label}
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "10px",
              objectFit: "cover",
              border: "1px solid var(--borde)",
            }}
          />
        ) : (
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "10px",
              border: "1px dashed var(--borde)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              color: "var(--muted)",
              textAlign: "center",
            }}
          >
            Sin foto
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            background: "transparent",
            color: "var(--texto)",
            border: "1px solid var(--borde)",
            padding: "8px 14px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {mostrarPreview ? "Cambiar" : "Subir imagen"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}
