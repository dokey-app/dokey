import React from "react";

export function Checkbox({ label, description, checked, defaultChecked, onChange, disabled = false, style, ...rest }) {
  const [inner, setInner] = React.useState(Boolean(defaultChecked));
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : inner;
  const toggle = (e) => { if (disabled) return; if (!isControlled) setInner(!on); onChange && onChange(!on, e); };
  return (
    <label onClick={toggle} style={{ display: "inline-flex", gap: 10, alignItems: description ? "flex-start" : "center", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...style }} {...rest}>
      <span style={{
        width: 16, height: 16, flex: "0 0 16px", marginTop: description ? 2 : 0,
        borderRadius: "var(--radius-xs)", display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: on ? "var(--action-primary)" : "var(--surface-card)",
        border: `1px solid ${on ? "var(--action-primary)" : "var(--border-default)"}`,
        transition: "var(--transition-control)"
      }}>
        {on && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6.3 4.6 9 10 3" /></svg>}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ font: "var(--type-ui)", color: "var(--text-body)" }}>{label}</span>
        {description && <span style={{ font: "var(--type-caption)", color: "var(--text-muted)" }}>{description}</span>}
      </span>
    </label>
  );
}
