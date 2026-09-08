import * as React from "react";

/** Surface container with optional header/footer bands. */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** CSS padding for the body. @default "var(--card-pad)" */
  padding?: string;
  /** Hover lift + accent border, for clickable cards. @default false */
  interactive?: boolean;
  /** Uses shadow-md at rest. @default false */
  elevated?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}
export declare function Card(props: CardProps): JSX.Element;
