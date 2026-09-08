import * as React from "react";

/** Modal for confirmations, share links and tool settings. */
export interface DialogProps {
  open?: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned action row. */
  footer?: React.ReactNode;
  /** Pixel width. @default 460 */
  width?: number;
  children?: React.ReactNode;
}
export declare function Dialog(props: DialogProps): JSX.Element;
