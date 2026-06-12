---
date: 2026-06-11
tags: [adt-lsp-mcp, e2e, devin, evidence, acp]
---

# adt-lsp-mcp e2e ran without evidence (Devin bypass)

## What went wrong

After adt-1/adt-2 passed locally, an agent ran adt-lsp-mcp e2e via **`devin -p`** plus package-local **`bun run mcp:e2e`** in `tools/adt-lsp-mcp` — **without** `--evidence`. No `.e2e/results/` file was written; the /e2e skill contract was bypassed.

## Why

- Two e2e entry points exist for `@openadt/adt-lsp-mcp`: root **`adt:e2e`** (evidence always on) vs package **`mcp:e2e`** (evidence opt-in).
- **`devin -p`** is not a substitute for the /e2e skill — it does not set `OPENADT_E2E_EVIDENCE=1`, inject `--evidence-dir`, or print `E2E_EVIDENCE_FILE`.
- Prior retrospect (04b2ba2) covered LSP transport/stdio regressions only, not the evidence/dispatch wiring added in c4768ce.
- `scripts/e2e.ts` still imported stale `ai-tests/framework/` paths until c4768ce fixed them to `e2e/framework/`.

## Fix applied (c4768ce)

| Wrong | Right |
| ----- | ----- |
| `devin -p` + `cd tools/adt-lsp-mcp && bun run mcp:e2e -- --scenario adt-1 …` | `OPENADT_E2E_AGENT=devin bun run adt:e2e -- adt-1` (+ operator `--destination` at runtime) |
| Bare package `mcp:e2e` for agent runs | Root `bun run adt:e2e` (sets `OPENADT_E2E_EVIDENCE=1`, auto `--evidence` + `--evidence-dir`) |
| Manual Devin prompt without dispatch | `bun run adt:e2e -- adt-1 --acp --agent devin` → run `command.local` from `.e2e/dispatch/<run-id>.json` |

Package-local only when debugging framework internals:

```bash
cd tools/adt-lsp-mcp && bun run mcp:e2e -- --scenario adt-1 --evidence
```

(operator supplies `--destination` locally; not recorded here)

## Prevention

1. **Skill:** `.agents/skills/e2e/SKILL.md` — adt-* section + anti-pattern callout.
2. **Spec:** `specs/mcp-ai-testing.md` § `@openadt/adt-lsp-mcp` entry (evidence).
3. **Observation:** `.agents/memory/observations/2026-06-11-adt-lsp-mcp-e2e-regressions.md` § Evidence wiring.
4. Before claiming e2e PASS/FAIL, confirm `E2E_EVIDENCE_FILE=` in stdout and a file under `.e2e/results/`.

## Lesson

**Scenario suite drives entry point:** `mcp-*` → `bun run e2e`; `adt-*` → `bun run adt:e2e`. Dispatch rejects cross-suite scenario codes. External agents (Devin, etc.) must use the skill entry point or ACP dispatch — never raw package scripts without evidence flags.
