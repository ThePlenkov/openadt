---
date: 2026-06-11
tags: [adt-lsp-mcp, mcp, refactor, e2e, adt-1, adt-2, transport]
---

# adt-lsp-mcp refactor broke adt-1 and adt-2 e2e

## What happened

Decoupling `tools/adt-lsp-mcp` from `sap-adt-mcp-launcher` left a minimal stdio MCP server that looked wired but failed adt-1 (quick search): empty/truncated tool results, ~120s hangs, logon `Internal error`.

## Root causes (symptom → cause)

| Symptom | Cause |
| ------- | ----- |
| Empty MCP tool body / “truncated” response | `tools/call` wrapped handler output as `{ result: { result: { content… } } }` |
| ~120s before any MCP traffic | E2e `run.ts` used fixed `setTimeout(120000)` instead of framed stdio client + initialize handshake |
| `Destination data must not be null` | `destinationsStorePath` pointed at file `~/.adtls/destinations.json` instead of directory `~/.adtls` |
| LSP calls mis-parameterized | Handler got raw `MessageConnection` instead of `LspConnectionTransport` |
| Blocking startup | Server awaited full LSP logon before accepting MCP stdin |

## Outcome

After fixes in `main.ts`, `e2e/run.ts`, `e2e/mcp-client.ts`, and exporting `LspConnectionTransport` from `@openadt/lsp-client`, adt-1 passed locally (~17s including SSO logon on cold start).

## adt-2 follow-up (transport lock check)

| Symptom | Cause |
| ------- | ----- |
| LSP method not found | Contracts used `adtLs/transport/*`; SAP expects `adtLs/cts/transport/*` |
| Wrong params | `checkTransportForObjectLock` needs getLsUri repotree URI + `{ objectInfo, operationType }` |
| Fixture miss | Scenario used non-existent `zcl_example`; switched to `cl_abap_typedescr` |

Fixed in `@openadt/adt-services` contracts, `adt_check_transport_lock` handler (getLsUri chain), and e2e scenario.

## Lesson

When splitting MCP launcher into direct-LSP stdio server, re-validate independently:

1. MCP JSON-RPC result shape
2. adtls store path semantics (`~/.adtls` directory)
3. `LspTransport` wiring (`LspConnectionTransport`)
4. LSP method namespace + param shapes against `@openadt/adt-services` (not copied launcher stubs)
5. Object URI chain: ADT path → getLsUri → repotree URI

Unit tests on tool registration alone do not catch these. See observation `.agents/memory/observations/2026-06-11-adt-lsp-mcp-e2e-regressions.md`.
