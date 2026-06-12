# @openadt/adt-mcp — unified ABAP MCP mesh

A single MCP server that **merges two tool groups** behind one endpoint, plus OpenADT-owned workflow prompts:

| Group        | Source                                                                 | Tools          |
| ------------ | ---------------------------------------------------------------------- | -------------- |
| SAP `abap_*` | Proxied from the official SAP ADT MCP (HTTP `/mcp`) inside `adt-lsc`    | grows with SAP |
| OpenADT `adt_*` | Run **in-process** over the same `adt-lsc` LSP connection            | 26 tools       |

One owned `adt-lsc` child backs both groups. The server speaks **stdio** by default (IDE/agent configs) or
**HTTP** (`--http`) for web MCP clients, and is managed entirely through the CLI.

## Prerequisites

- [SAP ADT for VS Code](https://marketplace.visualstudio.com/items?itemName=SAPSE.adt-vscode) installed
  (supplies `adt-lsc`; override with `ADT_LS_PATH`).
- [Bun](https://bun.sh) on `PATH` for dev / `bun run mcp:stdio`.

## Commands

```bash
adt-mcp serve                       # stdio mesh (own adt-lsc); default
adt-mcp serve --http --port 2236    # HTTP mesh on localhost:2236/mcp (Bearer)
adt-mcp serve --no-lsp              # SAP abap_* tools only
adt-mcp serve --no-proxy            # OpenADT adt_* tools only
adt-mcp serve --sap-port 2236 --sap-token <tok>   # attach to a running SAP MCP (SAP tools only)
adt-mcp serve --shared              # reuse a healthy shared daemon (SAP tools only)
adt-mcp status [--port N] [--json]
adt-mcp list   [--json]
adt-mcp stop   [--port N]
adt-mcp print-config [--port N]     # { url, headers } for HTTP-native clients
```

Dev: `bun packages/adt-mcp/src/cli.ts <command>` or `bun run mcp:stdio`.

## SAP source modes

| Mode             | Trigger                          | adt-lsc        | `adt_*` tools | SAP tools |
| ---------------- | -------------------------------- | -------------- | ------------- | --------- |
| **own** (default)| `serve`                          | spawned, owned | ✅ in-process | ✅ proxied |
| **attach**       | `serve --sap-port N [--sap-token]` | external     | —             | ✅ proxied |
| **shared**       | `serve --shared`                 | shared daemon  | —             | ✅ proxied |

`adt_*` tools require the owned LSP connection, so they are available in **own** mode only. In attach/shared
mode the mesh exposes the SAP `abap_*` group only.

## `serve` flags

| Flag                 | Default                       | Meaning                                                       |
| -------------------- | ----------------------------- | ------------------------------------------------------------- |
| `--http`             | off (stdio)                   | Serve the mesh over Streamable HTTP `/mcp` instead of stdio   |
| `--port N`           | `2236`                        | Mesh HTTP port (`--http`); else the SAP backend port          |
| `--workspace DIR`    | `~/.openadt/adt-ls-workspace` | `adt-lsc` `-data` directory                                   |
| `--lsp` / `--no-lsp` | `--lsp`                       | Include / exclude the OpenADT `adt_*` group (own mode)        |
| `--proxy` / `--no-proxy` | `--proxy`                 | Include / exclude the SAP `abap_*` group                      |
| `--sap-port N`       | —                             | Attach to an external SAP MCP on this port                    |
| `--sap-token T`      | endpoint store                | Bearer token for `--sap-port`                                 |
| `--shared`           | off                           | Reuse a healthy shared daemon from the endpoint store         |
| `--destination ID`   | —                             | Pre-logon + `setDestination` for one destination              |
| `--show-token`       | off                           | Print the Bearer token on `--http`                            |
| `--verbose` / `-v`   | off                           | LSP trace → `~/.openadt/logs/…`                               |

## Destinations

Auto-derived: every destination in `~/.adtls/destinations.json` (the ADT VS Code store; override the directory
with `ADTLS_HOME`) is registered at startup. There is no `--import` flag — point `--workspace` at the data
directory and destinations are pulled in automatically. Logon happens on demand (or eagerly for `--destination`).

## Prompts

OpenADT ships workflow prompts (authored in TypeScript) over `prompts/list` / `prompts/get`:
`create-abap-object`, `generate-rap-service`, `expose-odata-service`, `activate-and-test`. The SAP cheat-sheet is
also appended to `initialize.instructions`. Disable with `OPENADT_MCP_NO_GUIDANCE=1`.

## Tool name limits (Claude + Bedrock)

Long SAP tool names are shortened to fit the agent prefix budget (≤64 chars). Override the max with
`OPENADT_MCP_MAX_TOOL_NAME` (16–57). See `specs/mcp.md` § Agent backend tool name limits.

## Endpoint store

Each owned backend writes `~/.openadt/mcp/endpoints/<port>.json` (url, token, pids, destinations), mode `0600`,
pruned when the owning pid dies. Backs `status` / `list` / `stop` / `print-config` and `--shared` discovery.

## License

Do **not** bundle `adt-ls/` from the SAP extension in OpenADT releases — the SAP Developer License applies.
