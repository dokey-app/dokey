import * as React from "react";

/**
 * Read-only code surface with JSON syntax colouring — the output half of every tool.
 * @startingPoint section="Tools" subtitle="Dark code pane with JSON colouring" viewport="700x260"
 */
export interface CodePaneProps {
  code?: string;
  /** "json" enables colouring; anything else renders plain. @default "json" */
  language?: "json" | "text" | "jwt" | "base64";
  /** @default true */
  wrap?: boolean;
  /** @default false */
  lineNumbers?: boolean;
  /** CSS height, e.g. "220px". */
  height?: string;
  /** Dark pane (default) or light sunken surface. @default "dark" */
  tone?: "dark" | "light";
  style?: React.CSSProperties;
}
export declare function CodePane(props: CodePaneProps): JSX.Element;
