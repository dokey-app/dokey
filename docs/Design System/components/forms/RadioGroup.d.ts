import * as React from "react";

export interface RadioOption { value: string; label: string }

/** Exclusive choice among 2–4 short options. */
export interface RadioGroupProps {
  name?: string;
  options?: (string | RadioOption)[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** @default "column" */
  direction?: "row" | "column";
  style?: React.CSSProperties;
}
export declare function RadioGroup(props: RadioGroupProps): JSX.Element;
