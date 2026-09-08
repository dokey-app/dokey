import React from "react";

export function Dialog({ open = false, onClose, title, description, footer, width = 460, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 50, background: "var(--surface-overlay)",
      backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24
    }}>
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{
        width, maxWidth: "100%", background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-2xl)",
        boxShadow: "var(--shadow-lg)", overflow: "hidden",
        animation: "none"
      }}>
        <div style={{ padding: "var(--space-5) var(--space-5) var(--space-3)" }}>
          {title && <div style={{ font: "var(--type-h3)", color: "var(--text-strong)", letterSpacing: "var(--tracking-snug)" }}>{title}</div>}
          {description && <div style={{ marginTop: 6, font: "var(--type-ui)", fontWeight: 400, color: "var(--text-muted)" }}>{description}</div>}
        </div>
        {children && <div style={{ padding: "0 var(--space-5) var(--space-5)" }}>{children}</div>}
        {footer && <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "var(--space-3) var(--space-5)", borderTop: "1px solid var(--border-subtle)", background: "var(--surface-sunken)" }}>{footer}</div>}
      </div>
    </div>
  );
}
