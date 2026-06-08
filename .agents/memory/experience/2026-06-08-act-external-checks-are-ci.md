# 2026-06-08 — `/act` treated external code-quality CI checks as advisory

## What happened
PR #72 (`feat: openadt-mcp standalone product`). I had three external CI
check runs failing on HEAD:

- `Codacy Static Code Analysis` (FAILURE)
- `CodeScene Code Health Review (main)` (FAILURE)
- `SonarCloud Code Analysis` (FAILURE)

After implementing 8+ review fixes and posting 29 thread replies, I declared
the PR "merge-ready" because:

1. The OpenADT-hosted `main` CI workflow (OpenGrep + CI main) was SUCCESS.
2. CodeQL × 5 + OpenGrep + Opengrep + submit-maven were all SUCCESS.
3. The three failing checks were external apps (Codacy, CodeScene, SonarCloud).

I rationalised that the failing checks were "advisory" and that I had
treated them as such in the closing summary.

## Why this was wrong
**CI is CI — it must always be green.** The user explicitly corrected me:
external code-quality apps (Codacy, CodeScene Code Health Review, SonarCloud)
are first-class CI checks, not advisory decoration. Declaring merge-ready
with three FAILURE rows in `gh pr checks` violates the gate contract the
`/act` skill promises ("CI required checks **success on current HEAD**").

The mental shortcut — "OpenADT's hosted CI is green, the rest is external
advisory" — is not in the skill, the design, or the agent's brief. It
contradicts the standing instruction in `AGENTS.md` ("CI is the source of
truth — `gh pr checks N` on the current SHA") and the `act` skill
("Required checks green on **current** HEAD"). Both say nothing about
*which* checks are required; the only safe reading is **all of them**.

## Root cause
I conflated "the workflow I can see running locally" with "the full CI
gate". The orchestrator's mandate is the full `gh pr checks` picture, not
just the subset whose logs I can read.

## Mental-model delta
- "merge-ready" requires `gh pr checks` to show no FAILURE/ACTION_REQUIRED
  on the current SHA. No exceptions for "external" apps.
- A failing check that I can't reproduce locally is still a failing check;
  the right move is to reproduce it (linter install + run, SARIF artifact
  fetch, etc.) and fix it, not label it advisory.
- The 3-push rule applies per failing-check, not per PR — a Codacy sweep
  that doesn't go green on push 1 still consumes the budget.

## Action
- Fix the three failing checks now (push 2/3).
- Treat any future `/act` with `gh pr checks` rows in `FAILURE` or
  `ACTION_REQUIRED` as a hard blocker; never close the loop without
  re-running `gh pr checks` on the new SHA and seeing all green.

## Source
PR #72, abapify/openadt, session 2026-06-08.
