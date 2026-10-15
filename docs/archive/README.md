# docs/ — map (flat layout, one file per document of the methodology)

| Track | Files |
|-------|-------|
| A Discovery (1–9)  | research, vision, brd, prd, glossary, user-flows, user-stories, backlog, roadmap |
| B Design (10–15)   | design-plan, content-guide, screen-map (+ screens/), design-system-prompt, component-library-prompt, screens-prompt — or design-skipped.md |
| C Tech (16–21)     | data-model, tech-stack (ADR), architecture, api-spec (+ openapi.yaml, generated — never edited), security-and-access, analytics-spec |
| D Delivery (22–25) | test-plan, implementation-plan, tasks, agent-rules (living copy: /CLAUDE.md), launch-checklist |
| live               | open-questions.md (Q-NN), tasks.md (T-NNN queue + log), LESSONS.md, INVENTORY.md (written by /adopt or /discovery) |
| plans              | plans/T-NNN-*.md (active), plans/done/ (archive), plans/PLAN.template.md |

IDs: RISK M REQ-MOD NFR ENT ROLE FL EP US SCR ADR EVT Q T.
A fact lives in one document; others link by ID.
Two ways in: `/adopt` when these files already exist, `/discovery` to build them from zero.
