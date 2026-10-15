import React from "react";

export function Breadcrumbs({ items = [], style }) {
  return (
    <nav aria-label="breadcrumb" style={{ display: "flex", alignItems: "center", gap: 8, font: "var(--type-ui)", fontSize: "var(--text-xs)", ...style }}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        const label = typeof it === "string" ? it : it.label;
        const href = typeof it === "string" ? undefined : it.href;
        return (
          <React.Fragment key={label}>
            {last || !href
              ? <span style={{ color: last ? "var(--text-strong)" : "var(--text-muted)" }}>{label}</span>
              : <a href={href} style={{ color: "var(--text-muted)" }}>{label}</a>}
            {!last && <span style={{ color: "var(--text-subtle)" }}>/</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
