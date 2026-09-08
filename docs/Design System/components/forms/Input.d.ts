import * as React from "react";

/** Single-line text field with label, hint and error slots. */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  label?: string;
  /** Helper text under the field. */
  hint?: string;
  /** Error message — also switches the field to the danger border/ring. */
  error?: string;
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  /** Render the value in JetBrains Mono — tokens, hashes, URLs. @default false */
  mono?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}
export declare function Input(props: InputProps): JSX.Element;
