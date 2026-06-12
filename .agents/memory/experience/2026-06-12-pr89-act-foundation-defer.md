---
date: 2026-06-12
tags: [act, codescene, foundation-pr, defer, tsc-paths, fixture-leak]
---

# PR #89 /act — agent foundation with ~20k-line delta

## Session arc

1. Discovered 24 unresolved threads on a 394-file, +20k/-14k foundation refactor PR (`feat/agent-foundation-verb-stubs`).
2. 18 CodeScene delta findings on the new code (CC-9+, complex conditionals, code duplication), 3 github-code-quality findings (unused imports, unhandled stream-pipe), 1 CI failure on the `main` workflow (verify-fixtures-only flagged a fixture destination id in a memory file), 1 `submit-maven` deprecation notice.
3. Fixed the 4 clear wins in product code, deferred the 18 CodeScene findings to a follow-up refactor PR (matching the author's prior resolved-thread pattern), resolved all 24 threads, ran P5 scoring via a subagent, committed and pushed twice.
4. CI `main` failed on `adt-mcp:typecheck` (pre-existing — missing `@openadt/adt-lsp-contracts` and `@openadt/mcp-tools` paths in `packages/adt-mcp/tsconfig.json`). Fixed in a second push; CI then green.

## What went wrong (symptom → cause → fix)

| Symptom | Root cause | Lesson |
| --- | --- | --- |
| `verify-fixtures-only` flagged a full destination id in a narrative memory file | The fixture form passes the fixture SID guard, but the narrative-memory guard bans ANY destination id (including fixtures) — see `scripts/verify-agent-memory.ts:44` | When in doubt, describe the shape (`<SID>_<client>_<user>_<lang>`), never paste a concrete id — even a fixture. |
| `bunx tsc -p packages/adt-mcp/tsconfig.json --noEmit` failed on transitive `@openadt/adt-lsp-contracts` import | `adt-mcp/tsconfig.json` `paths` mapping omitted `@openadt/adt-lsp-contracts` and `@openadt/mcp-tools`. With no `dist/` to resolve from, tsc followed the `@openadt/adt-lsp-client` source mapping, then failed on the unmapped contracts import. | After a workspace-package split, every consumer's `tsconfig.json` `paths` must list **all** transitive workspace imports, not just direct ones. The "first `nx run` green" is misleading — `nx affected` runs the union, and the typecheck only fails when the local module is included. |
| 2 new github-code-quality threads re-opened on the same `process.stdin.pipe` lines after my "add `error` listener" fix | The bot's preferred fix is `pipeline()` (which also wires close/finish), not inline `error` listeners. | For MCP stdio servers, the consumer-stdout invariant is sacred; `error` listeners log to stderr and satisfy the bare "errors silently dropped" complaint, but `pipeline()` is the more correct fix. Either is defensible; the bot just re-flags until `pipeline()` is in. Document the trade-off in the thread, defer to the refactor PR. |

## How many `/act` runs to clear this PR

| Run | Action | Result |
| --- | --- | --- |
| 1 | Fix 4 clear wins + defer 18 CodeScene + resolve 24 + P5 + push 1 | CI failed on pre-existing `adt-mcp:typecheck` |
| 2 | Add 2 missing `tsconfig.json` paths + push 2 | CI green (`main` ✓, CodeScene App still red — deferred) |
| 3 | (not used) | 2 new bot threads from my new listeners — replied in-thread, resolved, no commit needed |

3-push rule respected (only 2 pushes).

## Pre-existing /act lessons reinforced

- The orchestrator rule "split the refactor into its own PR" is correct: 18 CodeScene findings on new code is not debt, and refactoring-on-foundation bloats the PR.
- The author's prior pattern (defer-with-backlog-item for CodeScene deltas on foundation code) was the right precedent — matching it kept this `/act` to 2 pushes.
- "Pre-existing is not an exemption" still applies even when the failure is *not* your fault: the typecheck broke on the PR head before I touched it, but I ran the verify block and it came back red, so I owned getting it green.

## Cycle check

- Reopened thread? No.
- Same rule flagged 2+ times after a fix? Yes — github-code-quality re-flagged the stream-pipe issue on the new `error` listeners, but with a different (stronger) suggested fix. Closed by replying + resolving.
- 2+ `/act` runs with no new product commits? No — 3 product commits (0088f0c, da24d80, ab1cd9d) + 1 P5 commit (e994e15).

No cycle signals. `/act` complete.
