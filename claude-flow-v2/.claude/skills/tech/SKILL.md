---
name: tech
description: Track C (docs 16-21) into docs/ - data model, stack ADRs, architecture, API, security, analytics
disable-model-invocation: true
---
# Tech — Track C

Requires track A complete (docs/prd.md, glossary.md; design optional). For a tiny
project or a single feature prefer /spec instead.

Interview with AskUserQuestion only about the "how": team
experience, hosting, budget, sensitive data. Then write in order
(product-discovery-docs skill if installed, Full profile, track C):
1. data-model.md — mermaid erDiagram; entity and field names are
   the ENGLISH glossary names, singular; lifecycles; tenancy
2. tech-stack.md — ADR-NN (context / decision / alternatives /
   consequences); versions VERIFIED by web search today, never
   from memory; "what we deliberately don't use"
3. architecture.md — components, 3-5 key flows as sequence
   diagrams by FL-NN, integrations with failure modes, envs,
   observability, scaling limits
4. api-spec.md — rules, auth, error format, endpoints per ENT-NN
   with required ROLE-NN; then GENERATE docs/openapi.yaml
   from it and validate. The yaml is derived: never hand-edited
5. security-and-access.md — roles referenced from glossary (not
   redefined), role × action × entity matrix covering every
   ROLE-NN and ENT-NN, PII register, threat model (>=5), audit log
6. analytics-spec.md — every M-NN from brd mapped to EVT-NN;
   events named object_action with glossary verbs; nothing that
   security-and-access forbids

Checkpoint 5: summarize ADRs, report invariant checks (glossary
names, roles matrix, M←EVT). Open P1 questions block the border.
New questions -> docs/open-questions.md. End: "next -> /delivery".
