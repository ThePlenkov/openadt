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

## Transport LSP namespace

CTS transport methods live under **`adtLs/cts/transport/*`**, not `adtLs/transport/*`.

Examples: `checkTransportForObjectLock`, `searchTransportsSimple`, `assignTransportToObject`, `createTransportForObjectLock`.

## Object URI chain (getLsUri-first)

Many tools need a **repotree/AFF URI**, not an ADT object path:

1. `adt_quick_search` → `references[].uri` (ADT path, e.g. `/sap/bc/adt/oo/classes/cl_x`)
2. `adtLs/repository/getLsUri` with `{ destination, adtUri }` → `{ uri }` (repotree URI)
3. Pass repotree URI to file/transport/lock operations

`checkTransportForObjectLock` params: `{ objectInfo: { objectUri: <repotree uri> }, operationType: 'MODIFICATION' | 'CREATION' }` — not `{ destination, uri, transportId }`.

## Destination id

Format: `SID_CLIENT_USER_LANG` (e.g. `ABC_200_USER_EN`). Must exist in `~/.adtls/destinations.json`. Server CLI arg or `OPENADT_DESTINATION` / `OPENADT_MCP_DESTINATION`.

## Guidance prompt

`@openadt/adt-lsp-mcp` exposes MCP prompt **`adt_lsp_workflow`** via `prompts/list` + `prompts/get`. Agents should fetch it before calling transport or read tools.

## E2e

```bash
cd tools/adt-lsp-mcp
bun run build
bun run mcp:e2e -- --scenario adt-1 --destination <SID_CLIENT_USER_LANG>
bun run mcp:e2e -- --scenario adt-2 --destination <SID_CLIENT_USER_LANG>
```

- Runner: `e2e/run.ts` + `e2e/mcp-client.ts` — Content-Length framing via `McpFrameDecoder`, not raw `JSON.parse` on stdout.
- Scenario markdown lives in `e2e/scenarios/`; pass `--scenario adt-N` to load only matching files (some scenario YAML titles with colons break bulk load).
- Standard fixture class: `cl_abap_typedescr` (not `zcl_example`).
