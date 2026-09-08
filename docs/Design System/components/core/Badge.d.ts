import * as React from "react";

/** Small status label: verification result, HTTP-ish state, algorithm name. */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** @default "neutral" */
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
  /** Render in JetBrains Mono — for algorithm names, byte counts, hashes. @default false */
  mono?: boolean;
  /** Leading status dot. @default false */
  dot?: boolean;
  children?: React.ReactNode;
}
export declare function Badge(props: BadgeProps): JSX.Element;
