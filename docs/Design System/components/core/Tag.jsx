import React from "react";

export function Tag({ selected = false, onRemove, interactive = false, style, children, ...rest }) {
  const [hover, setHover] = React.useState(false);
  return (
    <span
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, height: 26, padding: "0 10px",
        borderRadius: "var(--radius-pill)", font: "var(--type-ui)", fontSize: "var(--text-xs)",
        cursor: interactive || onRemove ? "pointer" : "default",
        transition: "var(--transition-control)",
        background: selected ? "var(--surface-accent-soft)" : hover && interactive ? "var(--surface-hover)" : "transparent",
        color: selected ? "var(--text-accent)" : "var(--text-muted)",
        border: `1px solid ${selected ? "var(--accent-300)" : "var(--border-subtle)"}`,
        ...style
      }} {...rest}>
      {children}
      {onRemove && (
        <span onClick={(e) => { e.stopPropagation(); onRemove(e); }} style={{ opacity: 0.6, fontSize: 13, lineHeight: 1 }}>×</span>
      )}
    </span>
  );
}
