import React from "react";

const palette = { key: "var(--code-key)", string: "var(--code-string)", number: "var(--code-number)", boolean: "var(--code-boolean)", punct: "var(--code-punct)", plain: "var(--code-fg)" };

/* Minimal JSON tokenizer — enough for previewing payloads, not a real parser. */
function tokenize(src) {
  const out = [];
  const re = /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(\btrue\b|\bfalse\b|\bnull\b)|([{}\[\],:])/g;
  let last = 0, m;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push([src.slice(last, m.index), "plain"]);
    const kind = m[1] ? "key" : m[2] ? "string" : m[3] ? "number" : m[4] ? "boolean" : "punct";
    out.push([m[0], kind]);
    last = re.lastIndex;
  }
  if (last < src.length) out.push([src.slice(last), "plain"]);
  return out;
}

export function CodePane({ code = "", language = "json", wrap = true, lineNumbers = false, height, tone = "dark", style }) {
  const dark = tone === "dark";
  const body = language === "json"
    ? tokenize(code).map(([t, k], i) => <span key={i} style={{ color: dark ? palette[k] : k === "plain" ? "var(--text-body)" : palette[k] }}>{t}</span>)
    : code;
  const lines = code.split("\n");
  return (
    <div style={{
      background: dark ? "var(--surface-code)" : "var(--surface-sunken)",
      color: dark ? "var(--code-fg)" : "var(--text-body)",
      borderRadius: "var(--radius-md)", padding: "12px 14px",
      font: "var(--type-code)", overflow: "auto", height, ...style
    }}>
      {lineNumbers ? (
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 14 }}>
          <div style={{ color: "var(--code-comment)", textAlign: "right", userSelect: "none" }}>
            {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
          </div>
          <pre style={{ margin: 0, whiteSpace: wrap ? "pre-wrap" : "pre", wordBreak: wrap ? "break-word" : "normal", font: "inherit" }}>{body}</pre>
        </div>
      ) : (
        <pre style={{ margin: 0, whiteSpace: wrap ? "pre-wrap" : "pre", wordBreak: wrap ? "break-word" : "normal", font: "inherit" }}>{body}</pre>
      )}
    </div>
  );
}
