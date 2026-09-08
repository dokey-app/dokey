Standard action button — use for anything the user clicks to run, copy, save or submit a tool operation.

\`\`\`jsx
<Button variant="primary" size="md" iconLeft={<Icon name="play" />}>Декодировать</Button>
\`\`\`

Variants: `primary` (one per view — the tool's main action), `secondary` (bordered, most toolbar buttons), `ghost` (icon-adjacent, low-noise), `soft` (accent-tinted, for chips-like affordances), `danger` (destructive only). Sizes `sm` 28px / `md` 34px / `lg` 40px. Never place two primaries side by side.
