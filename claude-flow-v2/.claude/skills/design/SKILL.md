---
name: design
description: Track B (docs 10-15) into docs/ - design plan, content guide, screen map, UI generation prompts
disable-model-invocation: true
---
# Design — Track B

Requires track A complete (docs/prd.md). If the product has no UI
(API, CLI, library) — say so, write docs/design-skipped.md with
one line of reason, and STOP.

Write in order (product-discovery-docs skill if installed,
Product profile, tracks B only):
1. design-plan.md — principles, direction, tokens (colors as hex,
   type with Cyrillic support, spacing, shape, motion), states,
   accessibility AA, "distinct from the default AI template" check
2. content-guide.md — voice, buttons, errors, empty states,
   confirmations; terms verbatim from glossary
3. screen-map.md (+ screens/scr-NN-name.md in Full profile) —
   SCR-NN with loading/empty/error states; FL↔SCR coverage table:
   list uncovered steps and orphan screens honestly
4. design-system-prompt.md, component-library-prompt.md,
   screens-prompt.md — each a SELF-CONTAINED prompt in a ```text
   block: the target tool (Claude Artifacts / v0 / Lovable / Figma
   Make) will not see our other files, so tokens, voice and context
   are copied inside, never referenced.

Checkpoint 4 after screens-prompt: summarize; if screens revealed
new requirements they go back into prd.md as REQ, not into chat.
New questions -> docs/open-questions.md. End: "next -> /tech".
