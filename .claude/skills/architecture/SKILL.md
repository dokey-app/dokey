---
name: architecture
description: Refresh docs/architecture.md from the actual codebase and flag drift against the tech docs
disable-model-invocation: true
---

# Architecture

Explore the codebase with subagents (summaries only): entry
points, modules, dependencies, data flow, storage, integrations.

UPDATE docs/architecture.md (or create it on the lite path):

- one-paragraph overview; module map; data flow for the 2-3 core
  scenarios as mermaid; key decisions linked to ADR-NN in
  tech-stack.md
- describe what IS, not what should be. If code contradicts the
  doc, the code wins — list every drift to the user, and for each
  ask: fix the code, or update the doc (and data-model /
  api-spec if affected)?

Keep it under 2 pages. Drift that needs a decision -> Q-NN.
