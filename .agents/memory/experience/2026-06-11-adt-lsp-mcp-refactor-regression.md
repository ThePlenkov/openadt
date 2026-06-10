---
date: 2026-06-11
tags: [adt-lsp-mcp, mcp, refactor, e2e, adt-1]
---

# adt-lsp-mcp refactor broke adt-1 e2e

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

## Lesson

When splitting MCP launcher into direct-LSP stdio server, re-validate three contracts independently: MCP JSON-RPC result shape, adtls store path semantics, and `LspTransport` wiring — unit tests on tool registration alone do not catch these.
