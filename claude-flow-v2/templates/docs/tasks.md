# Tasks — agent queue for <Product>

> One line = one task = one plan = one session. Ordered by
> docs/implementation-plan.md stages. /go takes the top unchecked line.
> Size rule: the plan fits on one screen, touches <= 5-7 files, has a binary
> "done" command, needs no human decision mid-way (resolve Q-NN first).
> Format: `- [ ] T-NNN — what (US-NNN) | scope: files/modules | done: command`

## Stage 0 — skeleton
- [ ] T-001 — repo skeleton per architecture.md (US: none — stage 0) | scope: root, ci | done: make lint test
- [ ] T-002 — hello-world deployed to prod URL (US: none — stage 0) | scope: deploy | done: curl -f $PROD/health

## Stage 1 — <EP-01 name>
- [ ] T-003 — <what> (US-001) | scope: <files> | done: <command>

## Log
<!-- appended by /ship: - YYYY-MM-DD T-NNN <commit> — one line -->
