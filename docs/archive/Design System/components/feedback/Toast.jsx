import React from "react";

const tones = {
  neutral: { border: "var(--border-default)", accent: "var(--text-muted)" },
  success: { border: "var(--border-subtle)", accent: "var(--text-success)" },
  danger: { border: "var(--border-subtle)", accent: "var(--text-danger)" },
  warning: { border: "var(--border-subtle)", accent: "var(--text-warning)" }
};

export function Toast({ tone = "neutral", title, description, icon, action, onClose, style }) {
  const t = tones[tone] || tones.neutral;
  return (
    <div role="status" style={{
      display: "flex", alignItems: "flex-start", gap: 10, width: 340, maxWidth: "100%",
      padding: "12px 14px", background: "var(--surface-card)",
      border: `1px solid ${t.border}`, borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-md)", ...style
    }}>
      {icon && <span style={{ color: t.accent, display: "flex", marginTop: 1 }}>{icon}</span>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "var(--type-ui)", color: "var(--text-strong)" }}>{title}</div>
        {description && <div style={{ marginTop: 2, font: "var(--type-caption)", color: "var(--text-muted)" }}>{description}</div>}
      </div>
      {action}
      {onClose && <button onClick={onClose} aria-label="Закрыть" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-subtle)", fontSize: 15, lineHeight: 1, padding: 0 }}>×</button>}
    </div>
  );
}
