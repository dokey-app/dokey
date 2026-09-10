import * as React from "react";

/**
 * Glyph wrapper over the inline sprite (D-54 п. 3). Requires `sprite.svg` to be inlined
 * in the document; takes no external dependency — the Lucide package and its CDN build are
 * not used in any form (ИНВ-01: third-party origins in a release build are exactly zero).
 * Intentional addition: gives every surface one icon API with the brand stroke weight.
 */
export interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  /** Sprite glyph name, kebab-case: "key-round". Resolves to `#icon-key-round`. */
  name: string;
  /** Pixel box. @default 16 */
  size?: number;
  /** Brand stroke weight. @default 1.75 */
  strokeWidth?: number;
  color?: string;
}
export declare function Icon(props: IconProps): JSX.Element;
