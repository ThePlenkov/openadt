---
date: 2026-06-09
tags: [act, review-debt, github, agents]
source: docs/plans/2026-06-09-review-debt-harvest.md
---

## Problem

`/act` per PR does not scale with many AI reviewers; merge is blocked on nits; no cross-PR batch queue.

## Proposed action

Complete Phase 1–2 from [docs/plans/2026-06-09-review-debt-harvest.md](../../docs/plans/2026-06-09-review-debt-harvest.md):

1. Validate `harvest-threads.ts` on a real merged PR (`workflow_dispatch`).
2. Implement `update-debt-status.ts` and wire debt PR merge → mark `done`.
3. Document merge policy (required CI only; conversations need not be resolved).
4. Tune `.agents/review-debt/config.json` for the full reviewer fleet.
