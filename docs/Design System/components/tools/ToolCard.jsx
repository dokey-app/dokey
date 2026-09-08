import React from "react";
import { Card } from "../core/Card.jsx";
import { Badge } from "../core/Badge.jsx";

export function ToolCard({ icon, title, description, category, shortcut, isNew = false, onClick, style }) {
  return (
    <Card interactive padding="var(--space-4)" onClick={onClick} style={{ display: "flex", flexDirection: "column", gap: 10, ...style }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{
          width: 36, height: 36, borderRadius: "var(--radius-md)", display: "inline-flex",
          alignItems: "center", justifyContent: "center",
          background: "var(--surface-accent-soft)", color: "var(--text-accent)"
        }}>{icon}</span>
        {isNew && <Badge tone="accent">NEW</Badge>}
      </div>
      <div>
        <div style={{ font: "var(--type-ui)", fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", color: "var(--text-strong)", letterSpacing: "var(--tracking-snug)" }}>{title}</div>
        <div style={{ marginTop: 4, font: "var(--type-caption)", color: "var(--text-muted)", lineHeight: 1.45 }}>{description}</div>
      </div>
      <div style={{ marginTop: "auto", paddingTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ font: "var(--type-caption)", color: "var(--text-subtle)" }}>{category}</span>
        {shortcut && <span style={{ font: "var(--type-code-sm)", color: "var(--text-subtle)" }}>{shortcut}</span>}
      </div>
    </Card>
  );
}
