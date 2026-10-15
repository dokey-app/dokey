import * as React from "react";

/** Copy-to-clipboard button with a 1.6s confirmed state. Present on every output pane. */
export interface CopyButtonProps {
  /** Text placed on the clipboard. */
  value?: string;
  /** @default "Копировать" */
  label?: string;
  /** @default "Скопировано" */
  copiedLabel?: string;
  /** @default "sm" */
  size?: "sm" | "md" | "lg";
  /** @default "secondary" */
  variant?: "primary" | "secondary" | "ghost" | "soft";
  style?: React.CSSProperties;
}
export declare function CopyButton(props: CopyButtonProps): JSX.Element;
