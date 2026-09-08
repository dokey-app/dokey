import * as React from "react";

/** Boolean option, optionally with a description line. */
export interface CheckboxProps {
  label: React.ReactNode;
  /** Secondary line under the label. */
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean, e: React.MouseEvent) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
