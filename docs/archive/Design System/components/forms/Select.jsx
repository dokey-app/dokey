import React from "react";

const heights = { sm: "var(--control-height-sm)", md: "var(--control-height-md)", lg: "var(--control-height-lg)" };

export function Select({ label, hint, options = [], size = "md", style, id, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const autoId = React.useId ? React.useId() : "sel";
  const selId = id || autoId;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label htmlFor={selId} style={{ font: "var(--type-label)", color: "var(--text-body)" }}>{label}</label>}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <select id={selId} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            appearance: "none", width: "100%", height: heights[size], padding: "0 30px 0 10px",
            font: "var(--type-ui)", color: "var(--text-strong)", background: "var(--surface-card)",
            border: `1px solid ${focus ? "var(--border-accent)" : "var(--border-default)"}`,
            borderRadius: "var(--radius-md)", outline: "none",
            boxShadow: focus ? "var(--ring-focus)" : "none",
            transition: "var(--transition-control)", cursor: "pointer", ...style
          }} {...rest}>
          {options.map((o) => {
            const value = typeof o === "string" ? o : o.value;
            const lbl = typeof o === "string" ? o : o.label;
            return <option key={value} value={value}>{lbl}</option>;
          })}
        </select>
        <span style={{ position: "absolute", right: 10, pointerEvents: "none", color: "var(--text-subtle)", fontSize: 10 }}>▾</span>
      </div>
      {hint && <span style={{ font: "var(--type-caption)", color: "var(--text-muted)" }}>{hint}</span>}
    </div>
  );
}
