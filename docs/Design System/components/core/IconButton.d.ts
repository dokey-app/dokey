import * as React from "react";

/** Square icon-only control for toolbars, panel headers and table rows. */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  /** @default "ghost" */
  variant?: "ghost" | "secondary" | "soft";
  /** Accessible name — required, also used as the title tooltip. */
  label: string;
  /** Pinned/selected state. @default false */
  active?: boolean;
  children?: React.ReactNode;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
