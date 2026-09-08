import React from "react";

export function Kbd({ style, children, ...rest }) {
  return (
    <kbd style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: 20, height: 20, padding: "0 5px",
      font: "var(--type-code-sm)", color: "var(--text-muted)",
      background: "var(--surface-card)", border: "1px solid var(--border-default)",
      borderBottomWidth: 2, borderRadius: "var(--radius-xs)", ...style
    }} {...rest}>{children}</kbd>
  );
}
