import * as React from "react";

/** Multi-line input — the main data-entry surface for encode/decode/diff tools. */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** Monospace by default — most textareas here hold payloads. @default true */
  mono?: boolean;
  /** @default "vertical" */
  resize?: "none" | "vertical" | "both";
}
export declare function Textarea(props: TextareaProps): JSX.Element;
