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
2. **MCP prompt:** `prompts/get` → `adt_lsp_workflow` on `@openadt/adt-lsp-mcp`
3. **Spec:** `specs/mcp.md` § `@openadt/adt-lsp-mcp`
4. **Tool descriptions:** transport tools document `cts/transport` + getLsUri chain

## Re-validate checklist (any adt-lsp-mcp change)

- [ ] MCP result shape (no double wrap)
- [ ] `destinationsStorePath` = directory
- [ ] `LspConnectionTransport` wiring
- [ ] LSP method namespace matches `@openadt/adt-services` contracts
- [ ] Object-modify tools: ADT path → getLsUri → repotree URI
- [ ] E2e runner uses framed stdio client
