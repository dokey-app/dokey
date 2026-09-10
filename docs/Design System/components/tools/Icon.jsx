import React from "react";

/* Renders a glyph from the inline sprite shipped with the build
   (D-54 п. 3): eight glyphs are copied into `sprite.svg` and referenced by id.
   The Lucide dependency is not taken in any form — no CDN, no UMD bundle, no npm
   package. Sterling reason, not preference: ИНВ-01 fixes the count of third-party
   origins in a release build at exactly zero, and an air-gapped image cannot reach
   unpkg at all. Glyph shapes still come from Lucide (ISC), attributed in the repo.

   The prop contract below is unchanged from the CDN-era component on purpose —
   D-54 п. 3 keeps the contract and swaps only the glyph source. */

export function Icon({ name, size = 16, strokeWidth = 1.75, color = "currentColor", style, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flex: "0 0 auto", ...style }}
      aria-hidden={true}
      {...rest}
    >
      <use href={`#icon-${name}`} />
    </svg>
  );
}
