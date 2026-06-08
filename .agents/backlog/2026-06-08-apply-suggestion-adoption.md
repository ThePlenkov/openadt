---
date: 2026-06-08
tags: [act, github, suggestions, metrics]
source: scripts/act/RATING_FLOW.md
---

## Problem

When a reviewer (human or AI) posts a GitHub ```suggestion block, `/act`
currently re-implements the change by hand. GitHub natively supports committing
a suggestion, and "suggestion was adopted" is a strong, cheap signal for the
review-tool study — but we capture neither the adoption nor the fact that the
finding came with a ready-to-apply diff.

## Proposed action

1. In `extract-findings.ts`, detect ```` ```suggestion ```` fences in review
   comment bodies and emit `has_suggestion: true` + the suggested replacement on
   the finding.
2. Add a `scripts/act/apply-suggestions.sh` (or extend submit) that, for
   accepted suggestions, applies the fenced replacement to the file at the
   comment's `path`/`line` and commits — the scriptable equivalent of GitHub's
   "Commit suggestion" button (one tool call, per [AGENTS.md → Script over
   steps](../../AGENTS.md)).
3. Add a `suggestion_applied` column to `review_scores.csv` so the notebook can
   measure adoption rate per tool alongside `master_rating`.
4. Wire the apply step into P3 (inline suggestions) in
   [act/SKILL.md](../skills/act/SKILL.md).

Keep it idempotent: skip suggestions already present on HEAD.
