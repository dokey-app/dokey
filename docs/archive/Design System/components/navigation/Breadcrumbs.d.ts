import * as React from "react";

export interface Crumb { label: string; href?: string }

/** Path from the catalogue root to the current tool. */
export interface BreadcrumbsProps {
  items?: (string | Crumb)[];
  style?: React.CSSProperties;
}
export declare function Breadcrumbs(props: BreadcrumbsProps): JSX.Element;
