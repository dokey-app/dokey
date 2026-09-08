import React from "react";
import { Button } from "../core/Button.jsx";
import { Icon } from "./Icon.jsx";

export function CopyButton({ value = "", label = "Копировать", copiedLabel = "Скопировано", size = "sm", variant = "secondary", style }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    try { navigator.clipboard && navigator.clipboard.writeText(value); } catch (e) { /* preview sandbox */ }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <Button size={size} variant={variant} onClick={copy} style={style}
      iconLeft={<Icon name={copied ? "check" : "copy"} size={14} />}>
      {copied ? copiedLabel : label}
    </Button>
  );
}
