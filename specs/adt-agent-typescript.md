# OpenADT TypeScript Agent

## Purpose

OpenADT exposes LSP operations as MCP tools via a TypeScript-based agent layer within the `sap-adt-mcp-launcher`. This enables agent workflows to interact with SAP ADT through LSP methods without requiring direct ADT REST calls.

## Surface

### CLI

```bash
# Standalone mode (owns adt-lsc, direct LSP access)
openadt mcp serve --stdio --standalone --proxy
openadt mcp serve --stdio --standalone --no-proxy

# HTTP daemon mode (owns adt-lsc, direct LSP access)
openadt mcp serve --proxy
openadt mcp serve --no-proxy
```

### Flags

- `--proxy` (default): Serve both SAP MCP tools (proxied) and custom LSP-based tools
- `--no-proxy`: Serve only custom LSP-based tools, reject SAP tool calls

### Configuration

Reuses `~/.openadt/config.toml` for destination configuration. The agent layer does not add new configuration options.

## Tool Reference

All custom tools are prefixed with `adt_` to distinguish from SAP MCP tools.

### High Priority Tools

| Tool Name                  | Description                              | LSP Method                                   |
| -------------------------- | ---------------------------------------- | -------------------------------------------- |
| `adt_atc_get_variants`     | Get available ATC check variants         | `adt/atc/getCheckVariants`                   |
| `adt_atc_run_check`        | Run ATC check on ABAP objects            | `adt/atc/runCheck`                           |
| `adt_lock_object`          | Lock an ABAP object for editing          | `adt/fileSystem/lockFile`                    |
| `adt_unlock_object`        | Unlock an ABAP object                    | `adt/fileSystem/unlockFile`                  |
| `adt_get_lock_status`      | Get lock status of an ABAP object        | `adt/fileSystem/getFileLockStatus`           |
| `adt_format_code`          | Format ABAP code                         | `adt/format/formatting`                      |
| `adt_get_diagnostics`      | Get syntax and check errors              | `adt/diagnostic/diagnostic`                  |
| `adt_find_references`      | Find usages/references of an ABAP object | `adt/references/findReferences`              |
| `adt_toggle_version`       | Toggle between active/inactive version   | `adt/fileSystem/toggleVersion`               |
| `adt_check_transport_lock` | Check if transport is required for lock  | `adt/transport/checkTransportForObjectLock`  |
| `adt_create_transport`     | Create a transport for object lock       | `adt/transport/createTransportForObjectLock` |
| `adt_assign_transport`     | Assign a transport to an object          | `adt/transport/assignTransportToObject`      |
| `adt_quick_search`         | Quick search in ABAP repository          | `adt/repository/quickSearch`                 |

### Medium Priority Tools

| Tool Name                        | Description                             | LSP Method                             |
| -------------------------------- | --------------------------------------- | -------------------------------------- |
| `adt_get_inactive_objects`       | Get list of inactive objects            | `adt/activation/getInactiveObjects`    |
| `adt_run_application`            | Run an ABAP application in console mode | `adt/applicationRun/runApplication`    |
| `adt_get_hover`                  | Get documentation for a code element    | `adt/hover/getHover`                   |
| `adt_document_symbols`           | Get document structure/outline          | `adt/documentSymbol/documentSymbols`   |
| `adt_search_transports`          | Simple search for transports            | `adt/transport/searchTransportsSimple` |
| `adt_search_transports_advanced` | Advanced search for transports          | `adt/transport/searchTransports`       |
| `adt_get_coverage`               | Get code coverage data                  | `adt/coverage/getCoverage`             |
| `adt_load_statement_coverage`    | Load statement-level coverage data      | `adt/coverage/loadStatementResults`    |

### Low Priority Tools

| Tool Name                | Description                                | LSP Method                        |
| ------------------------ | ------------------------------------------ | --------------------------------- |
| `adt_refresh_object`     | Force refresh an object from server        | `adt/fileSystem/forceRefresh`     |
| `adt_get_object_name`    | Get object name from URI                   | `adt/fileSystem/getObjectName`    |
| `adt_get_package_name`   | Get package name from URI                  | `adt/fileSystem/getPackageName`   |
| `adt_get_folder_uri`     | Get folder URI for navigation              | `adt/fileSystem/getFolderUri`     |
| `adt_get_external_links` | Get external links (e.g., ADT for Eclipse) | `adt/fileSystem/getExternalLinks` |

## Input/Output Schema

All tools follow a standardized JSON envelope:

```typescript
interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    destination?: string;
  };
}
```

MCP `tools/call` responses wrap this envelope as standard `CallToolResult`: JSON text in
`content[0].text`, the same object in `structuredContent`, and `isError: true` when
`success` is false (same pattern as read tools).

Error codes:

- `LOCKED_BY_OTHER`: Object locked by another user
- `NO_TRANSPORT`: Transport required but not available
- `NOT_FOUND`: Object not found
- `INVALID_URI`: Invalid ADT URI
- `THROTTLED`: Request throttled (rate limit)
- `INTERNAL`: Internal error
- `LSP_ERROR`: LSP method call failed
- `TIMEOUT`: LSP call timeout

## Out of Scope

- LSP-only operations (completion, code lens, debug)
- Tools already implemented in SAP MCP server (read tools are handled separately)
- Direct ADT REST calls from TypeScript layer

## Security

- Endpoint store files are `0600` permissions
- Bearer tokens only stored in endpoint store
- Secrets redacted in logs
- Only fictional fixtures allowed in git

## Tests

### Unit Tests

Each tool has a unit test file with:

- Mock `MessageConnection` that records LSP method calls
- Success path test
- Error path test (LSP error → `AgentErrorCode.LSP_ERROR`)
- Invalid input test

### Integration Tests

- Test full MCP server with `--proxy` mode
- Test full MCP server with `--no-proxy` mode
- Verify tool registration in `tools/list`
- Verify tool dispatch in `tools/call`

## Implementation Notes

### Standalone vs Shared Mode

- **Standalone mode** (`--standalone` or HTTP daemon): Full LSP access, agent tools available
- **Shared stdio mode** (`--stdio` without `--standalone`): No direct LSP access to daemon, agent tools not available

### Throttling

Format, diagnostics, and references tools are throttled to 4 requests per second per destination to prevent server overload.

### LSP Method Names

LSP method names follow the pattern `adt/<domain>/<action>`. These are custom methods from the SAP ADT Language Server protocol, not standard LSP.

## Dependencies

- Existing LSP connection infrastructure (`src/client/lsp-client.ts`)
- Existing MCP framing (`src/mcp/mcp-framing.ts`)
- Existing stdio proxy (`src/mcp/stdio-proxy.ts`)
- Existing read tools pattern (`src/service/read/`)
