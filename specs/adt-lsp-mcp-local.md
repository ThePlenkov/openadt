# ADT LSP MCP — local and global dev setup

Repo-local and user-global configuration for **`@openadt/adt-lsp-mcp`**: stdio MCP that calls `adt-lsc` over **pipe LSP** and exposes the 26 OpenADT `adt_*` tools.

**Workspace package** (installable as standalone product): `packages/adt-lsp-mcp/` — install via scoop/homebrew or use from workspace.

Product contract for the server itself (CLI, destination id, tools, prompts): [mcp.md § `@openadt/adt-lsp-mcp`](mcp.md#openadtadt-lsp-mcp-direct-lsp-stdio). HTTP/shared launcher setup: [mcp.md § Agent config](mcp.md#agent-config-stdio) and [mcp-shared-backend.md](mcp-shared-backend.md).

## When to use which server

| MCP server key | Entry | Backend | Tools |
| -------------- | ----- | ------- | ----- |
| `sap-adt` | `bun run mcp:stdio` | Shared HTTP MCP daemon (`packages/adt-mcp`) | SAP `abap_*` (+ optional OpenADT bridge) |
| `adt-lsp` | `adt-lsp-mcp <destination>` | Direct `adt-lsc` LSP (`packages/adt-lsp-mcp`) | OpenADT `adt_*` only (26 tools) |

Use **`adt-lsp`** when developing or exercising OpenADT LSP tools (`adt_read`, `adt_document_symbols`, transport helpers, etc.). Use **`sap-adt`** for the official SAP HTTP MCP surface and `abap_*` tools.

Both can be enabled in the same repo-local MCP config; keep server keys **short** — see [mcp.md § Agent backend tool name limits](mcp.md#agent-backend-tool-name-limits-claude--aws-bedrock).

## Prerequisites

| Requirement | Notes |
| ----------- | ----- |
| [Bun](https://bun.sh) on `PATH` | Required for building from source. Prebuilt binaries available via scoop/homebrew. |
| Built workspace packages | For dev builds: `bunx nx run-many -t build --projects=@openadt/adt-lsp-contracts,@openadt/adt-lsp-client,@openadt/adt-lsp-mcp-tools` |
| SAP ADT VS Code extension | Supplies `adt-lsc` (or set `ADT_LS_PATH`). |
| Destination in `~/.adtls` | Id format `SID_CLIENT_USER_LANG` (fixtures in docs: `ABC_200_USER_EN`, `DEV_100_USER_EN`). **Never commit a real destination id** in git-tracked MCP config. |

## Destination resolution (two modes)

| Mode | Startup | `tools/list` | `tools/call` |
| ---- | ------- | ------------ | ------------ |
| **Per-tool** (default, like standard SAP MCP) | No destination required | Each tool includes required `destination` | Pass `destination` in tool arguments |
| **Bound session** | CLI arg or `OPENADT_MCP_DESTINATION` / `OPENADT_DESTINATION` | `destination` **hidden** from schemas | Server injects bound value (tool arg ignored) |

Resolution order for bound mode (first wins):

1. CLI argument (`adt-lsp-mcp <destination>`)
2. `OPENADT_MCP_DESTINATION`
3. `OPENADT_DESTINATION`

**Per-tool mode** supports multiple destinations in one MCP session — the server lazily logons each destination on first use. **Bound mode** pre-logons one destination at startup (faster first call, simpler Inspector forms).

E2E scenarios pass `destination` in YAML steps — works in both modes (redundant when bound).

## Repo-local MCP config (recommended)

**Path:** `.cursor/mcp.json` at the repository root (Cursor). Claude Code uses **`.mcp.json`** with the same schema.

Run the agent from the repo root. Do **not** set `"cwd": "${workspaceFolder}"` — some agent builds break MCP spawn with it.

```json
{
  "mcpServers": {
    "sap-adt": {
      "command": "bun",
      "args": ["run", "mcp:stdio"]
    },
    "adt-lsp": {
      "command": "adt-lsp-mcp",
      "args": ["ABC_200_USER_EN"],
      "env": {
        "OPENADT_MCP_DESTINATION": "ABC_200_USER_EN"
      }
    }
  }
}
```

Replace `ABC_200_USER_EN` with your user-supplied destination id (see [mcp-ai-testing.md](mcp-ai-testing.md)). Omit the `env` block if `OPENADT_MCP_DESTINATION` is already set in the OS environment.

## Script chain

| Script | Resolves to |
| ------ | ----------- |
| `adt-lsp-mcp <destination>` | Standalone binary (packages/adt-lsp-mcp) |
| `bun packages/adt-lsp-mcp/src/main.ts <destination>` | Dev build from source |

**Destination** (for `tools/call` and background LSP): CLI arg, `OPENADT_MCP_DESTINATION`, or `OPENADT_DESTINATION`. Without it, **`tools/list` and prompts still work** (Inspector can connect); SAP calls fail until destination is set.

## Manual smoke (no IDE)

```bash
# From installed binary
adt-lsp-mcp ABC_200_USER_EN

# Or from source build
cd packages/adt-lsp-mcp
bun run build
bun src/main.ts ABC_200_USER_EN
```

### MCP Inspector (stdio)

**Recommended** — pass destination on the command line (Inspector UI → Args, space-separated):

```text
adt-lsp-mcp ABC_200_USER_EN
```

**CLI:**

```powershell
bunx @modelcontextprotocol/inspector adt-lsp-mcp ABC_200_USER_EN
```

Or env via Inspector `-e` flag:

```powershell
bunx @modelcontextprotocol/inspector -e OPENADT_MCP_DESTINATION=ABC_200_USER_EN adt-lsp-mcp
```

| Field | Value |
| ----- | ----- |
| Transport | **stdio** |
| Command | `adt-lsp-mcp` |
| Args | `ABC_200_USER_EN` (add destination as arg) |
| Env (optional) | `OPENADT_MCP_DESTINATION=…` if not passed as arg |

After **Connect**, you should see **27 tools** even before SAP logon. Logon runs on first `tools/call` (or immediately when destination is set at startup).

If ports **6274/6277** are busy: `Get-NetTCPConnection -LocalPort 6274 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`.

Live scenario tests: `bun run e2e -- run ls-N --destination <id>` — see [mcp-ai-testing.md](mcp-ai-testing.md).

## Global install (other repos / agents)

Install via scoop or homebrew:

```bash
# Windows (scoop)
scoop install adt-lsp-mcp

# macOS/Linux (homebrew)
brew install adt-lsp-mcp
```

User-global MCP example (`~/.cursor/mcp.json` — **not** committed to OpenADT):

```json
{
  "mcpServers": {
    "adt-lsp": {
      "command": "adt-lsp-mcp",
      "args": ["ABC_200_USER_EN"],
      "env": {
        "OPENADT_MCP_DESTINATION": "ABC_200_USER_EN"
      }
    }
  }
}
```

## Troubleshooting

| Symptom | Action |
| ------- | ------ |
| Inspector reconnect loop | Args: `scripts/mcp-adt-lsp.ts <destination>` — not `bun run mcp:adt-lsp`. Kill stale ports 6274/6277 if needed. |
| `Usage: adt-lsp-mcp <destination>` | Older builds — pull latest; or pass destination arg / set `OPENADT_MCP_DESTINATION`. |
| `ADT LS not found` | Install SAP ADT extension or set `ADT_LS_PATH`. |
| Logon / stale `adt-lsc` | Kill orphans: `Get-Process adt-lsc \| Stop-Process -Force` (PowerShell). |
| Missing tools / import errors | Re-run the Nx `build` chain for `@openadt/adt-lsp-*` packages. |
