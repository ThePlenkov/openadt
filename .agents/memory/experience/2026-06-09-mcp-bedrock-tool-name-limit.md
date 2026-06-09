---
date: 2026-06-09
tags: [mcp, claude, bedrock, agent-config]
---

# Claude Code + AWS Bedrock MCP tool name limit

## What went wrong

Claude Code failed to start the OpenADT repo with HTTP 400:

```text
ValidationException: toolSpec.name … must have length less than or equal to 64
Value 'mcp__sap-adt-dev__abap_business_services-fetch_service_information'
```

## Why

- Claude prefixes MCP tools as `mcp__<serverKey>__<toolName>` before calling AWS Bedrock Converse.
- Bedrock enforces **64 characters** on the combined name — not on the raw MCP tool name alone.
- Repo `.mcp.json` used server key `sap-adt-dev` (11 chars). Longest SAP tool name is 49 chars → combined **66 chars**.
- The limitation was not documented where agents or contributors edit MCP config.

## Fix applied

1. `.mcp.json` — server key `sap-adt-dev` → `sap-adt`; command aligned with `bun run mcp:stdio`.
2. Stdio proxy — `tool-name-limit.ts` shortens SAP tools > 45 chars; maps back on `tools/call`.
3. Documentation — `specs/mcp.md` (contract), `docs/usage.md` (troubleshooting), `README.md`, `openadt-product` skill.

## Prevention

Before changing `.mcp.json` or `.cursor/mcp.json` server keys:

```text
len(serverKey) + len(longestToolName) ≤ 57   // Claude + Bedrock
```

Use `sap-adt` or `adt`. Avoid `-dev` / `-local` suffixes unless `OPENADT_MCP_MAX_TOOL_NAME` is lowered accordingly.

**Authoritative spec:** [specs/mcp.md — Agent backend tool name limits](../../../specs/mcp.md#agent-backend-tool-name-limits-claude--aws-bedrock)
