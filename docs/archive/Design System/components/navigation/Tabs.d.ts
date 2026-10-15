import * as React from "react";

export interface TabItem { value: string; label: string; count?: number }

/**
 * Switches between views of one tool (Decoded / Raw / Headers) or catalogue sections.
 * @startingPoint section="Navigation" subtitle="Underline and segmented tab bars" viewport="700x150"
 */
export interface TabsProps {
  items?: (string | TabItem)[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** @default "underline" */
  variant?: "underline" | "segmented";
  style?: React.CSSProperties;
}
export declare function Tabs(props: TabsProps): JSX.Element;
