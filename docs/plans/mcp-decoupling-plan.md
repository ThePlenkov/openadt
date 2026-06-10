---
description: Decouple MCP servers into adt-lsp-mcp and adt-mcp-proxy
---

# MCP Decoupling Plan

**Status:** ✅ Completed

Separate the monolithic `sap-adt-mcp-launcher` into two focused MCP servers with shared infrastructure.

## Packages

### Shared Infrastructure Packages

#### 1. `@openadt/mcp-framing`

- **Purpose:** MCP stdio transport framing (Content-Length, NDJSON)
- **Exports:** `frameMcpMessage`, `McpFrameDecoder`, `McpStdioEncoder`, etc.
- **Location:** `tools/mcp-framing/`

#### 2. `@openadt/lsp-client`

- **Purpose:** LSP client for adt-lsc language server
- **Exports:** `connectAdtLanguageServer`, `callLspContract`, `LspTransport`
- **Location:** `tools/lsp-client/`

#### 3. `@openadt/adt-infra`

- **Purpose:** Shared infrastructure (RPC, logging, process utilities)
- **Exports:** `createClientPipeTransport`, `createMessageConnection`, `spawnAdtLsc`
- **Location:** `tools/adt-infra/`

#### 4. `@openadt/adt-services`

- **Purpose:** ADT LSP service layer (quickSearch, transport, document symbols, etc.)
- **Exports:** All ADT service functions
- **Location:** `tools/adt-services/`

#### 5. `@openadt/adt-config`

- **Purpose:** Configuration types and LSP method constants
- **Exports:** `AdtObjectReference`, `QuickSearchResult`, `LSP_METHOD_*`
- **Location:** `tools/adt-config/`

#### 6. `@openadt/mcp-tools`

- **Purpose:** MCP tool factory for creating tools
- **Exports:** `tool` factory function
- **Location:** `tools/mcp-tools/`

#### 7. `@openadt/adt-mcp-tools`

- **Purpose:** 26 ADT MCP tools (single source of truth)
- **Exports:** All `adt_*` tools (quick search, transport, document symbols, ATC, etc.)
- **Location:** `tools/adt-mcp-tools/`

### Server Packages

#### 8. `@openadt/adt-lsp-mcp`

- **Purpose:** Serves only LSP-based tools (the 26 `adt_*` tools)
- **Transport:** stdio only (LSP connection to adt-lsc)
- **Dependencies:** `@openadt/mcp-framing`, `@openadt/adt-mcp-tools`
- **Location:** `tools/adt-lsp-mcp/`
- **Status:** ✅ Completed

#### 9. `@openadt/adt-mcp-proxy`

- **Purpose:** Serves HTTP proxy service to SAP ADT
- **Transport:** HTTP (proxies to SAP ADT endpoints)
- **Dependencies:** `@openadt/mcp-framing`
- **Location:** `tools/adt-mcp-proxy/`
- **Status:** ✅ Stub created (needs full implementation)

#### 10. `@openadt/sap-adt-mcp-launcher` (existing)

- **Purpose:** Combined launcher (for backward compatibility)
- **Transport:** Both stdio and HTTP
- **Dependencies:** All shared packages
- **Location:** `tools/sap-adt-mcp-launcher/`
- **Status:** ✅ Updated to use shared packages

## Implementation

### Completed Steps

1. ✅ **Created shared infrastructure packages:**
   - `tools/mcp-framing/` - MCP framing (copied from sap-adt-mcp-launcher/src/mcp/)
   - `tools/lsp-client/` - LSP client (copied from sap-adt-mcp-launcher/src/client/, src/lsp/)
   - `tools/adt-infra/` - Infra components (copied from sap-adt-mcp-launcher/src/infra/)
   - `tools/adt-services/` - Service layer (copied from sap-adt-mcp-launcher/src/adt/services/)
   - `tools/adt-config/` - Config types (copied from sap-adt-mcp-launcher/src/config/)
   - `tools/mcp-tools/` - Tool factory (copied from sap-adt-mcp-launcher/src/adt/mcp/tool-factory.ts)

2. ✅ **Created shared tools package:**
   - `tools/adt-mcp-tools/` - 26 ADT tools (copied from sap-adt-mcp-launcher/src/adt/mcp/tools/)
   - Updated tool imports to use shared packages
   - Single source of truth for tools - changes only in one place

3. ✅ **Created adt-lsp-mcp package:**
   - `tools/adt-lsp-mcp/` - stdio-only MCP server
   - Depends on `@openadt/mcp-framing` and `@openadt/adt-mcp-tools`
   - Simple MCP server implementation using shared framing

4. ✅ **Created adt-mcp-proxy package:**
   - `tools/adt-mcp-proxy/` - HTTP proxy server stub
   - Depends on `@openadt/mcp-framing`
   - Needs full implementation (proxy logic, SAP `abap_*` tools)

5. ✅ **Updated sap-adt-mcp-launcher:**
   - Added workspace dependencies to package.json
   - Updated all imports to use shared packages
   - Maintains backward compatibility

6. ✅ **Set up workspace:**
   - Updated root package.json with workspaces array
   - Ran `bun install` to link workspace dependencies

## Architecture Benefits

- **Single source of truth:** Tools are in `@openadt/adt-mcp-tools` - changes only in one place
- **Focused packages:** Each package has a clear responsibility
- **Reusable infrastructure:** Shared packages can be used by multiple servers
- **Workspace management:** Bun workspaces handle dependency linking
- **Backward compatibility:** Existing `sap-adt-mcp-launcher` still works

## Next Steps

1. **Implement adt-mcp-proxy:**
   - Add HTTP proxy logic
   - Add SAP `abap_*` tools (read object, search objects, etc.)
   - Create test scenarios for proxy functionality

2. **Extract test utilities:**
   - Create `tools/mcp-test-utils/` package
   - Move shared framework code from `sap-adt-mcp-launcher/e2e/framework/`
   - Export as npm package

3. **Create test scenarios:**
   - adt-lsp-mcp test scenarios (already exist in `e2e/scenarios/`)
   - adt-mcp-proxy test scenarios (new)

## File Structure

```
tools/
├── adt-lsp-mcp/
│   ├── src/
│   │   ├── adt/mcp/tools/     # 26 LSP tools
│   │   ├── mcp/               # MCP SDK integration
│   │   └── main.ts            # stdio launcher
│   ├── e2e/
│   │   ├── scenarios/         # 26 scenarios (moved from scenarios-adt)
│   │   └── run.ts             # test runner
│   └── package.json
├── adt-mcp-proxy/
│   ├── src/
│   │   ├── proxy/             # HTTP proxy logic
│   │   └── main.ts            # HTTP launcher
│   ├── e2e/
│   │   ├── scenarios/         # proxy scenarios
│   │   └── run.ts             # test runner
│   └── package.json
├── mcp-test-utils/
│   ├── src/
│   │   ├── types.ts
│   │   ├── assertions.ts
│   │   ├── template.ts
│   │   ├── mcp-stdio-client.ts
│   │   └── evidence.ts
│   └── package.json
└── sap-adt-mcp-launcher/      # existing, updated to use shared utils
```
