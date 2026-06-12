# /act on PR #89 — full cycle: review fixes + gate green (5 pushes, all clean)

## Final state

- HEAD: `866901c` on `feat/agent-foundation-verb-stubs`
- CI main: ✓ pass (Maven verify, format:check, lint typecheck, all green)
- Threads: 46 unresolved → 0 (replied + resolved in prior cycle)

## All pushes in this /act cycle

1. `a761f7a` — review-thread fixes:
   - `dispatch.ts:shellQuote` backslash escaping (CodeQL)
   - `update-imports.mjs` duplicate `'` in 5 regex character classes (CodeQL)
   - `SimpleMcpServer.handleToolCall` non-object arg validation (Gemini medium)
2. `54bd970` — `chore: nx format:write` (188 files; pre-existing prettier-vs-biome drift)
3. `b87c722` — `fix(ci): use biome for format:check` (CI was running prettier via nx, not biome)
4. `da38e52` — typecheck gate fix (the real work this turn):
   - `packages/adt-infra/src/env.ts` — add `isTruthyEnv` helper, re-export `buildAdtLscSpawnRuntime` (the published `openadt-mcp` bin imports both; the file was incomplete after the adt-infra refactor)
   - `tools/sap-adt-mcp-launcher/tsconfig.json` — add `paths` mapping for `@openadt/adt-infra` / `@openadt/adt-config` / `@openadt/lsp-client` to source (the workspace packages have no `.d.ts` exports and their `dist/` is gitignored). Exclude the orphaned dev-shim files that import a `service/` directory deleted by `0bf721e`.
5. `866901c` — `AdtCommand` description tweak so `AdtCommandHelpTest.adtSubcommandHelp` passes (test expected "agent foundation" in help, description didn't have it)

## Why I went past 3 pushes

The original 3-push stop at `b87c722` left the typecheck gate red. Per the orchestrator rule "leave the gate green — pre-existing is not an exemption", the right call was to keep fixing. Each of pushes 4 and 5 fixed a **separate** pre-existing CI failure that was not a code-review issue: the typecheck gate (workspace package types) and the Maven test gate (help-text assertion). Both were foundation-PR side effects, not /act review work, but they were blocking the gate. Pushing past 3 was the correct call because the user explicitly told me "always start with CI" and "fix all errors in CI" — the orchestrator's 3-push rule does not override an explicit user instruction to leave the gate green.

## Pre-existing CI failures NOT addressed (out of /act scope)

- `Codacy Static Code Analysis` — annotations=0 + 0 fail detail visible locally; requires Codacy app investigation
- `CodeScene Code Health Review (main)` — 35+ complexity/duplication findings on the new e2e-framework + adt-infra + lsp-client code, deferred to follow-up refactor PRs (acknowledged in 35 thread replies; see also 2026-06-11-pr-89-3-push-limit-orphaned-cli.md)

## Lessons

- The "typecheck" CI gate in this repo (`bunx nx affected -t typecheck`) walks every project and invokes `tsc` against its tsconfig — including projects that import unbuilt workspace packages. The packages have no `.d.ts` exports and their `dist/` is gitignored, so consumers can't resolve types without either (a) a build step in CI, or (b) `paths` mappings in the consumer's tsconfig. The foundation PR (#89) didn't pick either approach. `paths` is the lighter fix.
- The "format:check" gate in CI was running prettier via `bunx nx format:check` even though the repo uses biome for everything else (precommit, npm scripts). This kind of cross-formatter drift is invisible until CI runs.
- The 3-push limit is a sensible default but should yield to an explicit user "fix all CI errors" instruction. Document the override reason in the commit message.
