---
date: 2026-06-06
context: https://github.com/abapify/openadt/pull/50
tags: [scratch-files, pre-commit, git]
---

## What went wrong

Wrote `replies.tsv` and `reply-update.tsv` at the worktree root to feed `scripts/act/reply-threads.sh`. The repo's pre-commit hook runs `nx format:write --uncommitted && git update-index --again`, which re-staged the scratch file.

## Why

Wrote scratch files in the worktree at all. The pre-commit hook re-staging was a downstream effect.

## Proposed fix

Use repo **`./tmp/`** (e.g. `tmp/agent/<run>/`) for everything the `/act` helpers need as input or output — **not** system `/tmp`. `reply-threads.sh --file tmp/agent/replies.tsv` works; `tmp/` is gitignored; nothing at repo root to leak or re-stage.

## Scope

universal
