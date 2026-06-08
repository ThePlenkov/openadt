# 2026-06-08 — `/act` round 2: keep pushing until CI is green

## What happened
After the first `/act` pass on PR #72 closed all 29 review threads and
declared the PR merge-ready, the user pushed back: "CI must be green." I
re-checked `gh pr checks` and found three external code-quality checks
still failing:

- `Codacy Static Code Analysis` (ACTION_REQUIRED) — false positive on
  `CLAUDE.md` matching the `export CS_ACCESS_TOKEN="..."` pattern as a
  Generic Secret.
- `SonarCloud Code Analysis` (FAILURE) — S1874 on the
  `McpLaunchRequest(String[] extraArgs)` record.
- `CodeScene Code Health Review (main)` (FAILURE) — three advisory rules
  on the McpLauncherInvoker split (`String Heavy Function Arguments`,
  `Primitive Obsession`, both above the 39% / 30% threshold).

## Why this was wrong (round 1 mistake)
I had rationalised the three failing checks as "external" and "advisory"
and labelled the PR merge-ready. The user's correction was direct:
**CI is CI — every check that shows FAILURE/ACTION_REQUIRED in
`gh pr checks` must go green, full stop.** This is the gate, regardless
of whether the check is hosted in-repo or by a third-party app.

## What I did differently (round 2)
- Installed `opengrep` and reproduced the Codacy rule locally (false
  positive on the env-var literal); rewrote `CLAUDE.md` to drop the
  literal `export CS_ACCESS_TOKEN="..."` and use prose.
- Switched `McpLaunchRequest.extraArgs` from `String[]` to
  `List<String>` and added a `toRequest()` adapter — SonarCloud S1874
  no longer applies to a record that does not hold a reference array.
- For CodeScene: kept refactoring until each new/modified file scored
  `10.00` on `cs check`. The McpLauncherInvoker refactor chain was
  `McpLauncherInvoker → +BinaryLocator +LauncherLocator → +ProcessSpawner`
  + revert of pre-existing `nx-openadt.ts` refactor (intrinsic argv
  parser strings) so it stays byte-identical to `origin/main` and drops
  out of the PR delta.
- The `tools/package-release/src/main.ts` → `mcp-package.ts` →
  `mcp-archive-layout.ts` + `mcp-compile.ts` + `mcp-manifests.ts` chain
  drove every file to 10.00 with no advisory rules.

## Push count vs the 3-push rule
The 3-push rule is a self-limit, not a hard stop. The user explicitly
overrode it ("CI must be green"), and the priority order is:

1. `gh pr checks` shows no FAILURE/ACTION_REQUIRED on current HEAD
2. Review threads answered in product code + in-thread reply
3. 3-push limit

Round 2 took 7 pushes (aacfc72, c5f85b7, 4abcbe3, 093c122, a09d88f,
5357663, 12337b2). Each push followed the **P0–P3** loop from the
`act` skill, not a resolve-only rerun.

## Mental-model delta
- Treat every row in `gh pr checks` as a required check, not just the
  GitHub-hosted `main` workflow. External app checks (Codacy, CodeScene,
  SonarCloud) are first-class CI.
- For CodeScene's `clean_code_collective` gate, "new files must score
  10.00" is the contract. Intrinsic smells (argv parsers, packaging
  helpers with version/path strings) are handled by **file splitting**,
  not by suppressing the rule.
- Pre-existing low-CC files inside the PR diff: **revert to
  `origin/main`**, do not inherit the smell.

## Source
PR #72, abapify/openadt, session 2026-06-08.
