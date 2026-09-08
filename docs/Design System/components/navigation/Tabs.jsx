import React from "react";

export function Tabs({ items = [], value, defaultValue, onChange, variant = "underline", style }) {
  const first = items[0] && (typeof items[0] === "string" ? items[0] : items[0].value);
  const [inner, setInner] = React.useState(defaultValue ?? first);
  const isControlled = value !== undefined;
  const current = isControlled ? value : inner;
  const pick = (v) => { if (!isControlled) setInner(v); onChange && onChange(v); };
  const seg = variant === "segmented";
  return (
    <div role="tablist" style={{
      display: "inline-flex", alignItems: "center", gap: seg ? 2 : 4,
      padding: seg ? 3 : 0, background: seg ? "var(--surface-sunken)" : "transparent",
      border: seg ? "1px solid var(--border-subtle)" : "none",
      borderBottom: seg ? "1px solid var(--border-subtle)" : "1px solid var(--border-subtle)",
      borderRadius: seg ? "var(--radius-lg)" : 0, ...style
    }}>
      {items.map((it) => {
        const v = typeof it === "string" ? it : it.value;
        const label = typeof it === "string" ? it : it.label;
        const count = typeof it === "string" ? undefined : it.count;
        const on = current === v;
        return (
          <button key={v} role="tab" aria-selected={on} onClick={() => pick(v)} style={{
            display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer",
            height: seg ? 28 : 36, padding: seg ? "0 12px" : "0 4px",
            marginBottom: seg ? 0 : -1,
            font: "var(--type-ui)",
            color: on ? "var(--text-strong)" : "var(--text-muted)",
            background: seg && on ? "var(--surface-card)" : "transparent",
            border: "none",
            borderBottom: seg ? "none" : `2px solid ${on ? "var(--accent-500)" : "transparent"}`,
            borderRadius: seg ? "var(--radius-md)" : 0,
            boxShadow: seg && on ? "var(--shadow-xs)" : "none",
            transition: "var(--transition-control)"
          }}>
            {label}
            {count !== undefined && <span style={{ font: "var(--type-code-sm)", color: "var(--text-subtle)" }}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
