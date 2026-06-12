---
date: 2026-06-11
tags: [adt-lsp-mcp, mcp, inspector, destination, guardrails, json-schema]
---

# adt-lsp MCP Inspector + destination guardrails

> Landscape ids omitted — operator destination lives in `~/.adtls` only.

## Session arc

1. Finished ls-1…ls-26 E2E on operator destination after package rename (`adt-lsp-contracts`, `adt-lsp-client`, `adt-lsp-mcp-tools`).
2. Local MCP setup spec split out: `specs/adt-lsp-mcp-local.md` (not a section in `mcp.md`).
3. MCP Inspector failed repeatedly: reconnect loop, 27 tools missing, tool forms with **no input fields**.
4. User challenged destination UX: why startup **and** per-tool? Decision: **SAP MCP parity** with optional bound mode.

## What went wrong (symptom → cause)

| Symptom | Root cause | Guardrail |
| ------- | ---------- | --------- |
| Inspector reconnect loop | Wrong cwd → `bun run mcp:adt-lsp` / script not found; or missing destination → instant exit; or **NDJSON in / Content-Length out** | Entry: `bun scripts/mcp-adt-lsp.ts` (repo root from script path). Mirror transport: `decoder.on('transport') → encoder.setTransport(mode)`. |
| Double spawn broke stdio (Windows) | Wrapper re-spawned server process | Single-process entry; no nested `bun run` for Inspector |
| Tools listed but **no form fields** | `tools/list` returned raw **Zod** objects, not JSON Schema | Always `z.toJSONSchema()` via `@openadt/mcp-tools` `toMcpInputSchema` / `listMcpToolDescriptors` |
| Agent assumed standard LSP for ls-7/ls-9 | Guessed `textDocument/*` vs `adtLs/*` without jar/e2e proof | Contract changes: verify method + params against live `adt-lsc` or SAP jars before flipping |
| E2e hit old behavior after “fix” | Stale `tools/adt-lsp-mcp/dist/main.mjs` | Rebuild chain after TS changes; e2e prefers dist when present |
| Real destination id in committed spec | Copied operator id into `adt-lsp-mcp-local.md` Inspector examples | Fixtures only in git: full id form `<SID>_<client>_<user>_<lang>` with fixture `<SID>`; never paste live ids into specs/memory |

## Destination UX decision (durable)

Match standard SAP MCP:

- **Unbound** (default): `destination` **required in every tool** schema and call; lazy logon per destination; multi-destination on one session OK.
- **Bound** (CLI arg or env): `destination` **omitted from `tools/list`** (`omitFields: ['destination']`); injected on `tools/call`.

Documented in `specs/mcp.md` and `specs/adt-lsp-mcp-local.md`.

## Where agents must look (prevention)

1. **Local dev + Inspector:** `specs/adt-lsp-mcp-local.md` (troubleshooting table)
2. **Product contract:** `specs/mcp.md` § `@openadt/adt-lsp-mcp`
3. **Stdio/LSP facts:** `.agents/memory/facts/2026-06-11-adt-lsp-mcp-stdio-contract.md`
4. **E2e regression patterns:** `.agents/memory/observations/2026-06-11-adt-lsp-mcp-e2e-regressions.md`
5. **Landscape redaction:** `.agents/memory/mental-models/agent-memory-landscape-redaction.md`

## Lesson

MCP “works in unit tests” is not enough. Inspector smoke (NDJSON client + `tools/list` schema shape + optional bound destination) catches an entire failure class that `mcpTools.length === 27` misses.
