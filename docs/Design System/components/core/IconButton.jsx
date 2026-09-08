import React from "react";

const sizes = { sm: 28, md: 34, lg: 40 };

export function IconButton({ size = "md", variant = "ghost", label, disabled = false, active = false, style, children, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const px = sizes[size] || sizes.md;
  const tone = {
    ghost: { background: active ? "var(--surface-active)" : "transparent", border: "1px solid transparent", color: "var(--text-muted)" },
    secondary: { background: "var(--surface-card)", border: "1px solid var(--border-default)", color: "var(--text-body)" },
    soft: { background: "var(--surface-accent-soft)", border: "1px solid transparent", color: "var(--text-accent)" }
  }[variant];
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: px, height: px, display: "inline-flex", alignItems: "center", justifyContent: "center",
        borderRadius: "var(--radius-md)", cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1, transition: "var(--transition-control)",
        ...tone,
        ...(hover && !disabled ? { background: variant === "soft" ? "var(--accent-100)" : "var(--surface-hover)", color: "var(--text-strong)" } : null),
        ...style
      }} {...rest}>
      {children}
    </button>
  );
}
