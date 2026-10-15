import React from "react";

export function EmptyState({ icon, title, description, action, compact = false, style }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 8, textAlign: "center", padding: compact ? "var(--space-6)" : "var(--space-12) var(--space-6)",
      color: "var(--text-muted)", ...style
    }}>
      {icon && <span style={{ color: "var(--text-subtle)", display: "flex" }}>{icon}</span>}
      <div style={{ font: "var(--type-ui)", fontSize: "var(--text-base)", color: "var(--text-strong)" }}>{title}</div>
      {description && <div style={{ font: "var(--type-caption)", maxWidth: 340 }}>{description}</div>}
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  );
}
