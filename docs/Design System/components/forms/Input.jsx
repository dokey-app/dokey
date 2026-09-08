import React from "react";

const heights = { sm: "var(--control-height-sm)", md: "var(--control-height-md)", lg: "var(--control-height-lg)" };

export function Input({ label, hint, error, size = "md", mono = false, prefix, suffix, id, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const autoId = React.useId ? React.useId() : "in";
  const inputId = id || autoId;
  const invalid = Boolean(error);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      {label && <label htmlFor={inputId} style={{ font: "var(--type-label)", color: "var(--text-body)" }}>{label}</label>}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, height: heights[size],
        padding: "0 10px", background: "var(--surface-card)",
        border: `1px solid ${invalid ? "var(--border-danger)" : focus ? "var(--border-accent)" : "var(--border-default)"}`,
        borderRadius: "var(--radius-md)",
        boxShadow: focus ? (invalid ? "var(--ring-danger)" : "var(--ring-focus)") : "none",
        transition: "var(--transition-control)", ...style
      }}>
        {prefix && <span style={{ color: "var(--text-subtle)", display: "flex" }}>{prefix}</span>}
        <input id={inputId} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent",
            color: "var(--text-strong)", font: mono ? "var(--type-code)" : "var(--type-ui)"
          }} {...rest} />
        {suffix && <span style={{ color: "var(--text-subtle)", display: "flex" }}>{suffix}</span>}
      </div>
      {(error || hint) && <span style={{ font: "var(--type-caption)", color: invalid ? "var(--text-danger)" : "var(--text-muted)" }}>{error || hint}</span>}
    </div>
  );
}
