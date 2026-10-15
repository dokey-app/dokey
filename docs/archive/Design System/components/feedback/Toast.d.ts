import * as React from "react";

/** Transient confirmation, bottom-right. Copy actions are the main trigger. */
export interface ToastProps {
  /** @default "neutral" */
  tone?: "neutral" | "success" | "danger" | "warning";
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onClose?: () => void;
  style?: React.CSSProperties;
}
export declare function Toast(props: ToastProps): JSX.Element;
