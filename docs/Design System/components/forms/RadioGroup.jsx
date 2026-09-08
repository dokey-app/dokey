import React from "react";

export function RadioGroup({ name, options = [], value, defaultValue, onChange, direction = "column", style }) {
  const [inner, setInner] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : inner;
  const pick = (v) => { if (!isControlled) setInner(v); onChange && onChange(v); };
  return (
    <div role="radiogroup" style={{ display: "flex", flexDirection: direction, gap: direction === "row" ? 16 : 10, ...style }}>
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const lbl = typeof o === "string" ? o : o.label;
        const on = current === v;
        return (
          <label key={v} onClick={() => pick(v)} style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <span style={{
              width: 16, height: 16, borderRadius: "999px", display: "inline-flex", alignItems: "center", justifyContent: "center",
              border: `1px solid ${on ? "var(--action-primary)" : "var(--border-default)"}`,
              background: "var(--surface-card)", transition: "var(--transition-control)"
            }}>
              {on && <span style={{ width: 8, height: 8, borderRadius: "999px", background: "var(--action-primary)" }} />}
            </span>
            <span style={{ font: "var(--type-ui)", color: "var(--text-body)" }}>{lbl}</span>
            <input type="radio" name={name} value={v} checked={on} readOnly style={{ display: "none" }} />
          </label>
        );
      })}
    </div>
  );
}
