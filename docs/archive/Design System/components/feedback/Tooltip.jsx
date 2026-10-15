import React from "react";

export function Tooltip({ content, side = "top", children, style }) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top: { bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
    bottom: { top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
    left: { right: "calc(100% + 6px)", top: "50%", transform: "translateY(-50%)" },
    right: { left: "calc(100% + 6px)", top: "50%", transform: "translateY(-50%)" }
  }[side];
  return (
    <span style={{ position: "relative", display: "inline-flex", ...style }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)} onBlur={() => setShow(false)}>
      {children}
      {show && (
        <span role="tooltip" style={{
          position: "absolute", zIndex: 40, ...pos, whiteSpace: "nowrap",
          padding: "5px 8px", borderRadius: "var(--radius-sm)",
          background: "var(--gray-900)", color: "var(--gray-0)",
          font: "var(--type-caption)", boxShadow: "var(--shadow-md)", pointerEvents: "none"
        }}>{content}</span>
      )}
    </span>
  );
}
