import React from "react";

const tones = {
  neutral: { background: "var(--surface-sunken)", color: "var(--text-muted)", border: "var(--border-subtle)" },
  accent: { background: "var(--surface-accent-soft)", color: "var(--text-accent)", border: "transparent" },
  success: { background: "var(--green-100)", color: "var(--text-success)", border: "transparent" },
  warning: { background: "var(--amber-100)", color: "var(--text-warning)", border: "transparent" },
  danger: { background: "var(--red-100)", color: "var(--text-danger)", border: "transparent" }
};

export function Badge({ tone = "neutral", mono = false, dot = false, style, children, ...rest }) {
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px", height: 22, padding: "0 8px",
      borderRadius: "var(--radius-sm)", background: t.background, color: t.color,
      border: `1px solid ${t.border}`,
      font: mono ? "var(--type-code-sm)" : "var(--type-label)",
      letterSpacing: mono ? 0 : "var(--tracking-snug)", whiteSpace: "nowrap", ...style
    }} {...rest}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: "999px", background: "currentColor" }} />}
      {children}
    </span>
  );
}
