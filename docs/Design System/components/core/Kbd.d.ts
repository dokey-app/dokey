import * as React from "react";

/** Keyboard key cap — used in the command palette hint and shortcut lists. */
export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}
export declare function Kbd(props: KbdProps): JSX.Element;
