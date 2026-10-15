import * as React from "react";

/** Pill-shaped filter or category token used in the tool catalogue. */
export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** @default false */
  selected?: boolean;
  /** Renders a × affordance. */
  onRemove?: (e: React.MouseEvent) => void;
  /** Adds hover feedback for clickable filter tags. @default false */
  interactive?: boolean;
  children?: React.ReactNode;
}
export declare function Tag(props: TagProps): JSX.Element;
