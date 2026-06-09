---
date: 2026-06-09
tags: [act, review-debt, github, agents]
source: docs/plans/2026-06-09-review-debt-harvest.md
---

## Problem

`/act` per PR does not scale with many AI reviewers; merge is blocked on nits; no cross-PR batch queue.

## Proposed action

Remaining from [docs/plans/2026-06-09-review-debt-harvest.md](../../docs/plans/2026-06-09-review-debt-harvest.md):

1. Validate `harvest-threads.ts` on a real merged PR (`workflow_dispatch`).
2. Tune `.agents/review-debt/config.json` for the full reviewer fleet.
3. Optional: auto-reply on source PRs after debt PR merges (`reply-threads.sh`).
4. Optional: bot PR for ledger commits instead of direct push to `main`.
