import React from "react";

/* Renders a Lucide glyph from the UMD build loaded on the page
   (https://unpkg.com/lucide@0.454.0/dist/umd/lucide.js -> window.lucide.icons).
   No icon paths are re-drawn here; the node data comes from Lucide itself. */

function toPascal(name) {
  return String(name).replace(/(^|[-_ ])(\w)/g, (_, __, c) => c.toUpperCase());
}

function lookup(name) {
  const lib = typeof window !== "undefined" && window.lucide && (window.lucide.icons || window.lucide);
  if (!lib) return null;
  return lib[toPascal(name)] || lib[name] || null;
}

export function Icon({ name, size = 16, strokeWidth = 1.75, color = "currentColor", style, ...rest }) {
  const node = lookup(name);
  const common = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round",
    style: { display: "block", flex: "0 0 auto", ...style }, "aria-hidden": true, ...rest
  };
  if (!node) return <svg {...common} />;
  // Lucide UMD exposes ["svg", attrs, children]; older shapes are already a pair array.
  const children = Array.isArray(node[2]) ? node[2] : node;
  return <svg {...common}>{children.map(([tag, attrs], i) => React.createElement(tag, { key: i, ...attrs }))}</svg>;
}
