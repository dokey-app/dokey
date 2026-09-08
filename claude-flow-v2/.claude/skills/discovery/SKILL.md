---
name: discovery
description: Phase 0 interview + Track A (docs 1-9) into docs/, opens docs/open-questions.md
disable-model-invocation: true
---
# Discovery — Track A

If docs/prd.md already exists, say so and STOP: the track
is done (maybe in Chat/Cowork). Suggest /go.

1. PHASE 0. Interview with AskUserQuestion — max 3 questions per
   round, max 2 rounds. Never re-ask what the user already said.
   Required before writing anything: user + pain, platform.
   Also: monetization, market/geo, stage, constraints.
   Draft a 3-5 sentence vision hypothesis. Create
   docs/open-questions.md from templates/ and log every unclear
   point as Q-NN with source "interview" and priority P1-P3.
2. TRACK A. If the product-discovery-docs skill is installed, run
   it in the Discovery profile with output into docs/.
   Otherwise write, strictly in this order, each using the IDs of
   the previous ones:
   research (web search, RISK-NN) → vision → brd (M-NN) →
   prd (REQ-MOD-NN, NFR-NN) → glossary (ENT-NN, ROLE-NN) →
   user-flows (FL-NN) → user-stories (EP-NN, US-NNN, Given/When/
   Then) → backlog (US checkboxes by epic + US↔REQ matrix) →
   roadmap (R0 must move at least one M-NN).
3. CHECKPOINTS. Stop and summarize (5-7 lines) after research,
   after prd, and after roadmap. Do not continue past a checkpoint
   without the user's go. No open P1 question crosses the last one.
4. Every file: header with status/version/"Opirayetsya na"/Q-NN
   links. New questions go to docs/open-questions.md, not into
   document tails.

After roadmap: run `sh scripts/docs-inventory.sh docs` and save the
output to docs/INVENTORY.md with the date.

Rules: numbers without a source are not written; unverified
statements are marked [ASSUMPTION] inline; vague requirements are
rewritten until testable. End: "next -> /design (if UI) or /tech".
