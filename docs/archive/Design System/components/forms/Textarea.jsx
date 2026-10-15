import React from "react";

export function Textarea({ label, hint, error, mono = true, rows = 6, resize = "vertical", style, id, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const autoId = React.useId ? React.useId() : "ta";
  const taId = id || autoId;
  const invalid = Boolean(error);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      {label && <label htmlFor={taId} style={{ font: "var(--type-label)", color: "var(--text-body)" }}>{label}</label>}
      <textarea id={taId} rows={rows} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          width: "100%", padding: "10px 12px", resize,
          background: "var(--surface-card)", color: "var(--text-strong)",
          font: mono ? "var(--type-code)" : "var(--type-body)",
          border: `1px solid ${invalid ? "var(--border-danger)" : focus ? "var(--border-accent)" : "var(--border-default)"}`,
          borderRadius: "var(--radius-md)", outline: "none",
          boxShadow: focus ? (invalid ? "var(--ring-danger)" : "var(--ring-focus)") : "none",
          transition: "var(--transition-control)", ...style
        }} {...rest} />
      {(error || hint) && <span style={{ font: "var(--type-caption)", color: invalid ? "var(--text-danger)" : "var(--text-muted)" }}>{error || hint}</span>}
    </div>
  );
}
