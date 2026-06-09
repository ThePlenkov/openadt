# Review debt ledger

Queryable queue of **unresolved PR review threads** harvested **after merge** (or manual backfill). Used by `/act debt` to batch-fix technical review debt without blocking releases.

**Not GitHub issues** — this file is agent-first, supports duplicates/heat maps, and links back to `reviewThread` ids.

## Files

| File | Purpose |
| ---- | ------- |
| `debt.jsonl` | One JSON object per line; canonical row per `thread_id` |
| `debt-summary.json` | Generated hotspots (`by_area`, `by_author`, duplicate fingerprints) |
| `config.json` | `ignore_authors` / `nit_authors` classification |

## When harvest runs

| Trigger | Scope |
| ------- | ----- |
| `pull_request` **closed** + merged | That PR only |
| `workflow_dispatch` | One PR (`pr_number` input) |

Harvest does **not** run on every `/act`, every CI run, or every push to `main`.

## Scripts

```bash
# Harvest one merged PR (local; needs gh auth)
bun scripts/act/harvest-threads.ts OWNER REPO PR --merged-sha SHA --run-id local

# Dry run
bun scripts/act/harvest-threads.ts OWNER REPO PR --dry-run

# Query open debt (agent input)
bun scripts/act/query-debt.ts --status open --limit 25 --format tsv

# Batch plan for /act debt
bun scripts/act/plan-debt-batch.ts --limit 25 --out /tmp/agent_$$/debt-batch-plan.md

# Mark done after debt PR merges
bun scripts/act/update-debt-status.ts --status done --fix-pr 99 --thread-id PRRT_…

# Hot spots and duplicates
bun scripts/act/query-debt.ts --write-summary
bun scripts/act/query-debt.ts --duplicates
bun scripts/act/query-debt.ts --area scripts/act
```

## Agent workflow (`/act debt`)

See [.agents/skills/act/SKILL.md](../skills/act/SKILL.md) § Debt mode.

1. `query-debt.ts --status open --limit N --format tsv`
2. Fix in product code on branch `cursor/review-debt-YYYY-MM-DD-f7a9`
3. Open batch PR; link source PR numbers + thread ids
4. After merge: `update-debt-status.ts --status done --fix-pr N --threads-file …`
5. Optional: `reply-threads.sh` + `resolve-open-threads.sh` on source PRs

## Row schema

```json
{
  "thread_id": "PRRT_…",
  "thread_url": "https://github.com/…/pull/N#…",
  "status": "open",
  "priority": "nit",
  "needs": "code_change",
  "source_pr": 81,
  "fingerprint": "sha256:…",
  "area": "apps/openadt-cli",
  "times_seen": 1
}
```

Statuses: `open` | `claimed` | `done` | `wontfix` | `duplicate`

## Plan

Full design: [docs/plans/2026-06-09-review-debt-harvest.md](../../docs/plans/2026-06-09-review-debt-harvest.md)
