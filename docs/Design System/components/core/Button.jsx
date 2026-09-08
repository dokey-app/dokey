import React from "react";

const sizes = {
  sm: { height: "var(--control-height-sm)", padding: "0 var(--control-pad-x-sm)", fontSize: "var(--text-xs)", gap: "6px", radius: "var(--radius-sm)" },
  md: { height: "var(--control-height-md)", padding: "0 var(--control-pad-x-md)", fontSize: "var(--text-sm)", gap: "8px", radius: "var(--radius-md)" },
  lg: { height: "var(--control-height-lg)", padding: "0 var(--control-pad-x-lg)", fontSize: "var(--text-base)", gap: "8px", radius: "var(--radius-md)" }
};

const variants = {
  primary: {
    rest: { background: "var(--action-primary)", color: "var(--text-on-accent)", border: "1px solid transparent", boxShadow: "var(--shadow-xs)" },
    hover: { background: "var(--action-primary-hover)" },
    active: { background: "var(--action-primary-active)" }
  },
  secondary: {
    rest: { background: "var(--surface-card)", color: "var(--text-strong)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-xs)" },
    hover: { background: "var(--surface-hover)" },
    active: { background: "var(--surface-active)" }
  },
  ghost: {
    rest: { background: "transparent", color: "var(--text-body)", border: "1px solid transparent" },
    hover: { background: "var(--surface-hover)", color: "var(--text-strong)" },
    active: { background: "var(--surface-active)" }
  },
  soft: {
    rest: { background: "var(--surface-accent-soft)", color: "var(--text-accent)", border: "1px solid transparent" },
    hover: { background: "var(--accent-100)" },
    active: { background: "var(--accent-200)" }
  },
  danger: {
    rest: { background: "var(--action-danger)", color: "#fff", border: "1px solid transparent", boxShadow: "var(--shadow-xs)" },
    hover: { background: "var(--action-danger-hover)" },
    active: { background: "var(--red-600)" }
  }
};

export function Button({ variant = "primary", size = "md", iconLeft, iconRight, fullWidth = false, disabled = false, type = "button", style, children, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    height: s.height, padding: s.padding, gap: s.gap,
    font: "var(--type-ui)", fontSize: s.fontSize, letterSpacing: "var(--tracking-snug)",
    borderRadius: s.radius, cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1, whiteSpace: "nowrap", width: fullWidth ? "100%" : undefined,
    transition: "var(--transition-control), transform var(--duration-instant) var(--ease-standard)",
    transform: press && !disabled ? "translateY(0.5px)" : "none",
    ...v.rest,
    ...(hover && !disabled ? v.hover : null),
    ...(press && !disabled ? v.active : null),
    ...style
  };
  return (
    <button type={type} disabled={disabled} style={base}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)} {...rest}>
      {iconLeft}{children}{iconRight}
    </button>
  );
}
