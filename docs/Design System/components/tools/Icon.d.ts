import * as React from "react";

/**
 * Lucide glyph wrapper. Requires the Lucide UMD script on the page.
 * Intentional addition: gives every surface one icon API with the brand stroke weight.
 */
export interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  /** Lucide icon name, kebab or Pascal: "key-round", "KeyRound". */
  name: string;
  /** Pixel box. @default 16 */
  size?: number;
  /** Brand stroke weight. @default 1.75 */
  strokeWidth?: number;
  color?: string;
}
export declare function Icon(props: IconProps): JSX.Element;
