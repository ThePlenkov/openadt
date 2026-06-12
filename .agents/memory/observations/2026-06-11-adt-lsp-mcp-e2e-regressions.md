---
date: 2026-06-11
tags: [adt-lsp-mcp, mcp, e2e, transport, lsp]
---

# adt-lsp-mcp e2e regressions (adt-1 + adt-2)

Consolidated observation from the decoupling refactor and first two live e2e scenarios.

## Pattern

Splitting `sap-adt-mcp-launcher` into `@openadt/adt-lsp-mcp` broke e2e in **layers**, not in tool registration. Unit tests that only assert `mcpTools.length === 26` miss all failure modes below.

## adt-1 (quick search)

| Symptom | Root cause |
| ------- | ---------- |
| Empty / truncated tool body | `tools/call` double-wrapped `{ result: { result: { content } } }` |
| ~120s hang | E2e runner slept instead of Content-Length MCP handshake |
| `Destination data must not be null` | `destinationsStorePath` = file path instead of `~/.adtls` directory |
| LSP param errors | Raw `MessageConnection` passed instead of `LspConnectionTransport` |
| Slow MCP accept | Server blocked on LSP logon before answering `initialize` |

## adt-2 (transport lock check)

| Symptom | Root cause |
| ------- | ---------- |
| LSP "method not found" | Wrong namespace `adtLs/transport/*` — correct is `adtLs/cts/transport/*` |
| Param shape rejected | `checkTransportForObjectLock` needs `{ objectInfo: { objectUri }, operationType }`, not `{ destination, uri, transportId }` |
| Missing objectUri | Must call `adtLs/repository/getLsUri` on ADT path first; pass repotree URI to transport check |
| Scenario fixture miss | `zcl_example` not in landscape; use standard `cl_abap_typedescr` |

## Prevention (where agents look first)

1. **Facts:** `.agents/memory/facts/2026-06-11-adt-lsp-mcp-stdio-contract.md`
2. **Local Inspector setup:** `specs/adt-lsp-mcp-local.md`
3. **MCP prompt:** `prompts/get` → `adt_lsp_workflow` on `@openadt/adt-lsp-mcp`
4. **Spec:** `specs/mcp.md` § `@openadt/adt-lsp-mcp`
5. **Tool descriptions:** transport tools document `cts/transport` + getLsUri chain

## MCP Inspector guardrails (2026-06-11)

| Symptom | Root cause |
| ------- | ---------- |
| Reconnect loop | Wrong cwd / script not found; missing destination exit; NDJSON/Content-Length mismatch |
| No tool input fields | `tools/list` returned Zod, not JSON Schema |
| Windows stdio flake | Double-process spawn wrapper |

**Smoke:** NDJSON initialize → tools/list → assert each tool `inputSchema.properties` non-empty; with bound destination assert `destination` absent.

See experience: `.agents/memory/experience/2026-06-11-adt-lsp-mcp-inspector-destination-guardrails.md`.

## Re-validate checklist (any adt-lsp-mcp change)

- [ ] MCP result shape (no double wrap)
- [ ] `destinationsStorePath` = directory
- [ ] `LspConnectionTransport` wiring
- [ ] LSP method namespace matches `@openadt/adt-lsp-contracts` (verify live, do not guess standard vs `adtLs/*`)
- [ ] Object-modify tools: ADT path → getLsUri → repotree URI
- [ ] E2e runner uses framed stdio client
- [ ] `tools/list` emits JSON Schema (`toMcpInputSchema`)
- [ ] Stdio encoder mirrors client transport (NDJSON vs Content-Length)
- [ ] Rebuild `tools/adt-lsp-mcp/dist` before e2e if dist exists
- [ ] No real destination ids in committed specs/config (fixtures only)

## Evidence wiring (c4768ce — not covered by 04b2ba2 retrospect)

Separate failure mode: scenarios **passed** but left **no evidence** because agents bypassed the /e2e skill.

| Symptom | Root cause |
| ------- | ---------- |
| No `.e2e/results/` after “successful” adt-1 run | `devin -p` + package `bun run mcp:e2e` without `--evidence` |
| Agent metadata missing in evidence | `OPENADT_E2E_AGENT` not set — use skill entry, not bare `devin -p` |
| `scripts/e2e.ts` import errors | Stale `ai-tests/framework/` paths; framework lives at `e2e/framework/` |
| Wrong dispatch for adt-* | `bun run e2e -- adt-1 …` rejected — use `bun run adt:e2e` (suite guard in dispatch) |

**Correct paths:**

- Local with evidence: `bun run adt:e2e -- adt-N` (+ operator `--destination` at runtime; `OPENADT_E2E_EVIDENCE=1` always on).
- External agent: `bun run adt:e2e -- adt-N --acp --agent devin` or `adt:e2e:dispatch`.
- Package-local debug only: `cd tools/adt-lsp-mcp && bun run mcp:e2e -- … --evidence`.

See experience: `.agents/memory/experience/2026-06-11-adt-lsp-e2e-evidence-bypass.md`.
