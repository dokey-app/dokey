Only icon primitive in the system. Lucide shapes, 1.75 stroke, 16px inside controls, 18–20px in panel headers, 22px in tool cards.

\`\`\`jsx
<Icon name="key-round" size={18} />
\`\`\`

Glyphs come from the **inline sprite** built with the bundle: the eight glyphs the product
uses are copied into `sprite.svg`, inlined into the document, and referenced as
`<use href="#icon-<name>">`. **Never load Lucide from a CDN or npm** — third-party origins in a
release build are exactly zero (ИНВ-01, NFR-09), and an air-gapped self-hosted image cannot
reach one at all. Adding a glyph means editing the sprite; that is deliberately more expensive
than importing from a bundle, because eight glyphs must not grow on their own (D-54 п. 3).

Hand-drawing new paths is still wrong: shapes are copied from Lucide (ISC, attributed in the
repository), not redrawn.
