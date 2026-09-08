import * as React from "react";

/** Short label on hover/focus — icon buttons, truncated values, keyboard hints. */
export interface TooltipProps {
  content: React.ReactNode;
  /** @default "top" */
  side?: "top" | "bottom" | "left" | "right";
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Tooltip(props: TooltipProps): JSX.Element;
