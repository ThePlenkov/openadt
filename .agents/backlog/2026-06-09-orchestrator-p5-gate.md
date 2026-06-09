---
date: 2026-06-09
tags: [orchestrator, act, p5, p6, skill-gap]
source: PR #77 /act — skipped P5, did P6 only in summary form
---

## Problem

The `/act` skill clearly documents P5 (rate findings) and P6 (retrospective) but the orchestrator's
`openadt-orchestrator.md` and the `cloud-agent.md` rules don't reference them. On PR #77 I finished
P0–P4, declared "merge-ready", and skipped P5 entirely. The user noticed and asked if the prompt/skill
needed updating.

Symptoms:
- P5 step is in `.agents/skills/act/SKILL.md` lines 61, 123–145, but no checklist mention in the
  orchestrator self-instructions (`.kilo/rules/openadt-orchestrator.md`) or the cloud-agent
  baseline (`.kilocode/rules/cloud-agent.md`).
- P6 is in the same place but the orchestrator's "Merge-ready" block has its own 5-bullet
  checklist (lines 170–175 of the skill) that doesn't gate on P5/P6 completion.
- Easy to mis-prioritise: when the user's PR is "fixed and green", the temptation is to declare
  done and skip the research-dataset step.

The real cost: I missed kilo-code-bot's CRITICAL finding on `ensure-backend.ts:346` (synchronous
spawn() throw leaves child undefined → ReferenceError on child.unref). That was the most useful
finding of the PR — caught a real bug in my own fix. The research-dataset step would have surfaced
it earlier as a "5" rating and forced a re-read of the diff.

## Proposed action

Add an explicit P5 + P6 gate to `openadt-orchestrator.md` (and the cloud-agent baseline) so the
merge-ready checklist cannot be satisfied without:

1. `bun .agents/skills/act/scripts/extract-findings.ts OWNER REPO PR` run
2. `review_scores.csv` upserted via `submit-scores.ts`
3. Retrospective (or explicit "no retrospective needed" reason) recorded
4. **All three artifacts verified to be committed** (`git log -- .agents/act/review_scores.csv
   .agents/memory/experience/ .agents/backlog/` shows a commit on the current branch). The user
   on PR #77 had to commit the artifacts themselves because the orchestrator's final "merge-ready"
   message did not check `git status` / `git log` for persistence — this is the most important
   bullet: a write that isn't pushed is invisible to the next session.

Concrete patch for `.kilo/rules/openadt-orchestrator.md` (near the merge-ready section, around
"Verify block — run before any commit"):

```md
## 2b. /act gate — P5 + P6 are mandatory

After P0–P4 (CI green, review fixes in code, threads resolved), do NOT declare
merge-ready until:

```bash
# P5: rate every check-run + review finding 0–5 into review_scores.csv
mkdir -p /tmp/agent_$$ && cd /workspace/<repo>
bun .agents/skills/act/scripts/extract-findings.ts OWNER REPO PR > /tmp/agent_$$/findings.jsonl
# write /tmp/agent_$$/scores.tsv (finding_id<TAB>0-5<TAB>why)
bun .agents/skills/act/scripts/submit-scores.ts OWNER REPO PR --evaluator <model-id> \
  --findings /tmp/agent_$$/findings.jsonl --scores /tmp/agent_$$/scores.tsv
```

# P6: retrospective (or skip with reason)
# - If anything went wrong: /retrospect --plan
# - Otherwise: append a 1-line "no retrospective" note to the PR summary
```

Skipping P5 has a real cost — see PR #77: kilo-code-bot's CRITICAL on `ensure-backend.ts:346`
(spawn() throw → child.unref ReferenceError) was the highest-signal finding of the PR and
I would have caught my own incomplete fix earlier if I'd re-read the diff under P5.
