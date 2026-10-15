import React from "react";

export function Card({ padding = "var(--card-pad)", interactive = false, elevated = false, header, footer, style, children, ...rest }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-xl)",
        boxShadow: elevated ? "var(--shadow-md)" : "var(--shadow-xs)",
        transition: "border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard)",
        ...(interactive && hover ? { borderColor: "var(--accent-300)", boxShadow: "var(--shadow-md)", transform: "translateY(-1px)" } : null),
        cursor: interactive ? "pointer" : "default",
        overflow: "hidden", ...style
      }} {...rest}>
      {header && <div style={{ padding: "12px var(--space-4)", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, font: "var(--type-ui)", color: "var(--text-strong)" }}>{header}</div>}
      <div style={{ padding }}>{children}</div>
      {footer && <div style={{ padding: "10px var(--space-4)", borderTop: "1px solid var(--border-subtle)", background: "var(--surface-sunken)", font: "var(--type-caption)", color: "var(--text-muted)" }}>{footer}</div>}
    </div>
  );
}
