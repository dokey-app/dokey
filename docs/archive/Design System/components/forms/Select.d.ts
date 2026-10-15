import * as React from "react";

export interface SelectOption { value: string; label: string }

/** Native select styled to match Input — algorithm pickers, output formats. */
export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  hint?: string;
  /** Strings or {value,label} pairs. */
  options?: (string | SelectOption)[];
  /** @default "md" */
  size?: "sm" | "md" | "lg";
}
export declare function Select(props: SelectProps): JSX.Element;
