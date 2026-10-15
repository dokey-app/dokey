import React from "react";

export function Switch({ label, checked, defaultChecked, onChange, disabled = false, style }) {
  const [inner, setInner] = React.useState(Boolean(defaultChecked));
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : inner;
  const toggle = () => { if (disabled) return; if (!isControlled) setInner(!on); onChange && onChange(!on); };
  return (
    <label onClick={toggle} style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...style }}>
      <span role="switch" aria-checked={on} style={{
        width: 34, height: 20, borderRadius: "999px", padding: 2, display: "inline-flex",
        background: on ? "var(--action-primary)" : "var(--gray-300)",
        transition: "background-color var(--duration-fast) var(--ease-standard)"
      }}>
        <span style={{
          width: 16, height: 16, borderRadius: "999px", background: "#fff", boxShadow: "var(--shadow-xs)",
          transform: on ? "translateX(14px)" : "translateX(0)",
          transition: "transform var(--duration-fast) var(--ease-out)"
        }} />
      </span>
      {label && <span style={{ font: "var(--type-ui)", color: "var(--text-body)" }}>{label}</span>}
    </label>
  );
}
