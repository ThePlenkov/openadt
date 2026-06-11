---
description: Decouple MCP servers into adt-lsp-mcp and adt-mcp-proxy
---

# MCP Decoupling Plan

**Status:** ✅ Completed (package rename 2026-06)

Separate the monolithic `sap-adt-mcp-launcher` into focused MCP servers with shared infrastructure.

## Packages

### Shared Infrastructure Packages

#### 1. `@openadt/mcp-framing`

- **Purpose:** MCP stdio transport framing (Content-Length, NDJSON)
- **Location:** `packages/mcp-framing/`

#### 2. `@openadt/adt-lsp-client`

- **Purpose:** LSP client for adt-lsc — connection, transport, open-document lifecycle, **operations API**
- **Exports:** `connectAdtLanguageServer`, `callLspContract`, `LspTransport`, `getDocumentSymbols`, `runAtcCheck`, …
- **Location:** `packages/adt-lsp-client/`

#### 3. `@openadt/adt-lsp-contracts`

- **Purpose:** LSP method contract specs only (`lspEndpoint` definitions)
- **Exports:** `quickSearch`, `documentSymbol`, `runCheck`, `lspEndpoint`, …
- **Location:** `packages/adt-lsp-contracts/`

#### 4. `@openadt/adt-infra`

- **Purpose:** Shared infrastructure (RPC, logging, process utilities)
- **Location:** `packages/adt-infra/`

#### 5. `@openadt/adt-config`

- **Purpose:** Configuration types and LSP method constants
- **Location:** `packages/adt-config/`

#### 6. `@openadt/mcp-tools`

- **Purpose:** Transport-agnostic MCP tool factory
- **Location:** `packages/mcp-tools/`

#### 7. `@openadt/adt-lsp-mcp-tools`

- **Purpose:** 26 thin ADT MCP tools (Zod + JSON envelope)
- **Exports:** All `adt_*` tools; calls `@openadt/adt-lsp-client` operations only
- **Location:** `packages/adt-lsp-mcp-tools/`

### Server Packages

#### 8. `@openadt/adt-lsp-mcp`

- **Purpose:** stdio MCP server for the 26 `adt_*` tools
- **Dependencies:** `@openadt/mcp-framing`, `@openadt/adt-lsp-mcp-tools`, `@openadt/adt-lsp-client`
- **Location:** `tools/adt-lsp-mcp/`

#### 9. `@openadt/adt-mcp-proxy`

- **Purpose:** HTTP proxy service to SAP ADT
- **Location:** `tools/adt-mcp-proxy/`

#### 10. `@openadt/sap-adt-mcp-launcher`

- **Purpose:** Combined launcher (backward compatibility)
- **Location:** `tools/sap-adt-mcp-launcher/`

## Layering

```
tools/adt-lsp-mcp (stdio server)
  → @openadt/adt-lsp-mcp-tools (MCP handlers)
    → @openadt/adt-lsp-client (operations + transport)
      → @openadt/adt-lsp-contracts (method specs)
```

## Architecture Benefits

- **Clear names:** contracts vs client vs MCP tools vs server binary
- **Reusable client:** operations API usable without MCP/Zod
- **Single source of truth:** MCP tool schemas in `adt-lsp-mcp-tools`; orchestration in `adt-lsp-client`
