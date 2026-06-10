---
date: 2026-06-11
tags: [adt-lsp-mcp, mcp, lsp, adtls, e2e]
---

# `@openadt/adt-lsp-mcp` stdio + LSP contract

Package: `tools/adt-lsp-mcp/` — stdio-only MCP for the 26 `adt_*` tools (direct LSP to `adt-lsc`, no HTTP MCP bridge).

## LSP destination store

`adtLs/destinations/initializeService` param `destinationsStorePath` is the **directory** that contains `destinations.json`, not the file path.

- Correct: `~/.adtls`
- Wrong: `~/.adtls/destinations.json` → adt-lsc logs `…/destinations.json/destinations.json` and `createProject` fails with `Destination data must not be null`

## MCP JSON-RPC shape

`tools/call` success response must be `{ jsonrpc, id, result: { content, isError? } }` — the tool handler return value is the **`result` field**, not nested under `result.result`.

## LSP transport for tools

`@openadt/adt-mcp-tools` handlers expect `LspTransport` (`sendRequest(method, params)` with named params). Pass `LspConnectionTransport(session.connection)` — not raw `MessageConnection`.

Export: `LspConnectionTransport` from `@openadt/lsp-client`.

## Startup model

- MCP `initialize` / `tools/list` can respond immediately on stdio.
- LSP connect + `createProject` + `ensureLoggedOn` runs in background; first `tools/call` awaits it.
- Cold SSO logon still bounded by `DEFAULT_LOGON_TIMEOUT_MS` (~300s) in `@openadt/lsp-client`.

## E2e

```bash
cd tools/adt-lsp-mcp
bun run build
bun run mcp:e2e -- --scenario adt-1 --destination <SID_CLIENT_USER_LANG>
```

- Runner: `e2e/run.ts` + `e2e/mcp-client.ts` — Content-Length framing via `McpFrameDecoder`, not raw `JSON.parse` on stdout.
- Scenario markdown lives in `e2e/scenarios/`; pass `--scenario adt-1` to load only matching files (some scenario YAML titles with colons break bulk load).
