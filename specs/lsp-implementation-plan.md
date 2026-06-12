# LSP Operations Implementation Plan

This document outlines the implementation plan for migrating LSP operations from the SAP ADT Language Server to MCP tools in OpenADT.

## Context

The SAP ADT VS Code extension includes a Language Server (LSP) with numerous operations for ABAP development. Some of these are already exposed as MCP tools in the official SAP MCP server, but many are not available via MCP. This plan identifies which operations should be implemented as MCP tools and provides a phased implementation strategy.

## Prerequisites

- Existing MCP infrastructure in `tools/sap-adt-mcp-launcher/`
- SAP ADT SDK client in `apps/openadt-sap-adt/`
- Understanding of ADT URI mapping (`AdtLsUriUtil` equivalent)
- Async execution pattern (`AdtLsAsyncHelper` equivalent)

## Phase 1: Core Development Tools (High Priority)

### 1.1 ATC (ABAP Test Cockpit) Integration

**Tools to implement:**

- `adt_atc_run_check` - Run ATC checks on objects
- `adt_atc_get_variants` - Get available ATC check variants

**Implementation approach:**

1. Create `AtcCheckService` in `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/atc/`
2. Use existing `com.sap.adt.atc.core` and `com.sap.adt.atc` SDK services
3. Map `AtcRunCheckParams` to MCP input schema
4. Map `AtcRunCheckResponse` to MCP output schema
5. Implement async execution with progress monitoring

**Input schema for `adt_atc_run_check`:**

```json
{
  "type": "object",
  "properties": {
    "destination": { "type": "string" },
    "uris": {
      "type": "array",
      "items": { "type": "string" },
      "description": "List of ADT URIs to check"
    },
    "variant": { "type": "string", "description": "ATC check variant name" }
  },
  "required": ["destination", "uris"]
}
```

**Output schema:**

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "severity": { "type": "string" },
          "message": { "type": "string" },
          "objectUri": { "type": "string" },
          "line": { "type": "number" }
        }
      }
    }
  }
}
```

**Estimated effort:** 2-3 days

### 1.2 Object Locking

**Tools to implement:**

- `adt_lock_object` - Lock object for editing
- `adt_unlock_object` - Unlock object
- `adt_get_lock_status` - Get current lock status

**Implementation approach:**

1. Create `ObjectLockService` in `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/lock/`
2. Use existing ADT transport/lock services
3. Handle lock conflicts and user prompts

**Input schema for `adt_lock_object`:**

```json
{
  "type": "object",
  "properties": {
    "destination": { "type": "string" },
    "uri": { "type": "string" }
  },
  "required": ["destination", "uri"]
}
```

**Estimated effort:** 1-2 days

### 1.3 Code Formatting

**Tools to implement:**

- `adt_format_code` - Format ABAP code according to pretty printer rules

**Implementation approach:**

1. Create `CodeFormatService` in `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/format/`
2. Use `IGenericPrettyPrinterService` from SDK
3. Support multiple formats: ABAP, DDL, DDLA, SRVD, BSCE

**Input schema:**

```json
{
  "type": "object",
  "properties": {
    "destination": { "type": "string" },
    "uri": { "type": "string" },
    "content": { "type": "string" }
  },
  "required": ["destination", "uri", "content"]
}
```

**Output schema:**

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "formattedContent": { "type": "string" }
  }
}
```

**Estimated effort:** 1-2 days

### 1.4 Diagnostics

**Tools to implement:**

- `adt_get_diagnostics` - Get syntax and check errors for object

**Implementation approach:**

1. Create `DiagnosticService` in `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/diagnostic/`
2. Use existing check services from SDK
3. Implement throttling to avoid server overload

**Input schema:**

```json
{
  "type": "object",
  "properties": {
    "destination": { "type": "string" },
    "uri": { "type": "string" }
  },
  "required": ["destination", "uri"]
}
```

**Output schema:**

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "diagnostics": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "severity": {
            "type": "string",
            "enum": ["error", "warning", "info"]
          },
          "message": { "type": "string" },
          "range": {
            "type": "object",
            "properties": {
              "start": { "type": "number" },
              "end": { "type": "number" }
            }
          }
        }
      }
    }
  }
}
```

**Estimated effort:** 2 days

### 1.5 References

**Tools to implement:**

- `adt_find_references` - Find all usages of an object

**Implementation approach:**

1. Create `ReferenceService` in `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/references/`
2. Use RIS (Repository Information System) services
3. Return locations in LSP format for compatibility

**Input schema:**

```json
{
  "type": "object",
  "properties": {
    "destination": { "type": "string" },
    "uri": { "type": "string" },
    "position": {
      "type": "object",
      "properties": {
        "line": { "type": "number" },
        "character": { "type": "number" }
      }
    }
  },
  "required": ["destination", "uri"]
}
```

**Output schema:**

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "locations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "uri": { "type": "string" },
          "range": {
            "type": "object",
            "properties": {
              "start": {
                "type": "object",
                "properties": {
                  "line": { "type": "number" },
                  "character": { "type": "number" }
                }
              },
              "end": {
                "type": "object",
                "properties": {
                  "line": { "type": "number" },
                  "character": { "type": "number" }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

**Estimated effort:** 2-3 days

### 1.6 Version Toggle

**Tools to implement:**

- `adt_toggle_version` - Toggle between active and inactive version

**Implementation approach:**

1. Create `VersionService` in `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/version/`
2. Use existing ADT version services
3. Handle object lifecycle states

**Input schema:**

```json
{
  "type": "object",
  "properties": {
    "destination": { "type": "string" },
    "uri": { "type": "string" }
  },
  "required": ["destination", "uri"]
}
```

**Estimated effort:** 1 day

### 1.7 Transport Management

**Tools to implement:**

- `adt_check_transport_lock` - Check transport for object lock
- `adt_create_transport` - Create transport for object lock
- `adt_assign_transport` - Assign transport to object

**Implementation approach:**

1. Create `TransportService` in `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/transport/`
2. Use existing transport services from SDK
3. Handle workbench vs customizing transports
4. Support transport search and assignment

**Input schema for `adt_check_transport_lock`:**

```json
{
  "type": "object",
  "properties": {
    "destination": { "type": "string" },
    "uri": { "type": "string" }
  },
  "required": ["destination", "uri"]
}
```

**Input schema for `adt_create_transport`:**

```json
{
  "type": "object",
  "properties": {
    "destination": { "type": "string" },
    "uri": { "type": "string" },
    "transportType": { "type": "string", "enum": ["workbench", "customizing"] },
    "description": { "type": "string" }
  },
  "required": ["destination", "uri", "transportType"]
}
```

**Estimated effort:** 3-4 days

### 1.8 Repository Search

**Tools to implement:**

- `adt_quick_search` - Quick search in repository

**Implementation approach:**

1. Create `RepositorySearchService` in `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/repository/`
2. Use RIS (Repository Information System) services
3. Support various search types (by name, type, package)

**Input schema:**

```json
{
  "type": "object",
  "properties": {
    "destination": { "type": "string" },
    "searchTerm": { "type": "string" },
    "objectType": { "type": "string" },
    "package": { "type": "string" },
    "maxResults": { "type": "number", "default": 50 }
  },
  "required": ["destination", "searchTerm"]
}
```

**Output schema:**

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "results": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "type": { "type": "string" },
          "uri": { "type": "string" },
          "package": { "type": "string" }
        }
      }
    }
  }
}
```

**Estimated effort:** 2-3 days

## Phase 2: Navigation and Analysis Tools (Medium Priority)

### 2.1 Inactive Objects

**Tools to implement:**

- `adt_get_inactive_objects` - Get list of inactive objects

**Implementation approach:**

1. Extend `ActivationService` with inactive object query
2. Filter by package or object type

**Estimated effort:** 1 day

### 2.2 Application Run

**Tools to implement:**

- `adt_run_application` - Run ABAP application in console

**Implementation approach:**

1. Create `ApplicationRunService` in `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/run/`
2. Use `IAbapApplicationConsoleRunService` from SDK
3. Stream console output

**Estimated effort:** 2 days

### 2.3 Hover Information

**Tools to implement:**

- `adt_get_hover` - Get documentation for code element

**Implementation approach:**

1. Create `HoverService` in `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/hover/`
2. Use `ICodeElementInformationBackendService`
3. Return markdown-formatted documentation

**Estimated effort:** 1-2 days

### 2.4 Document Symbols

**Tools to implement:**

- `adt_document_symbols` - Get document structure/outline

**Implementation approach:**

1. Create `SymbolService` in `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/symbols/`
2. Use object structure services from SDK
3. Return hierarchical symbol tree

**Estimated effort:** 2 days

### 2.5 Transport Search

**Tools to implement:**

- `adt_search_transports` - Simple search for transports
- `adt_search_transports_advanced` - Advanced search for transports

**Implementation approach:**

1. Extend `TransportService` with search capabilities
2. Support filtering by user, status, type, target system
3. Return transport metadata

**Input schema for `adt_search_transports`:**

```json
{
  "type": "object",
  "properties": {
    "destination": { "type": "string" },
    "user": { "type": "string" },
    "status": { "type": "string", "enum": ["modifiable", "released", "all"] }
  },
  "required": ["destination"]
}
```

**Estimated effort:** 2 days

### 2.6 Code Coverage

**Tools to implement:**

- `adt_get_coverage` - Get code coverage data
- `adt_load_statement_coverage` - Load statement-level coverage

**Implementation approach:**

1. Create `CoverageService` in `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/coverage/`
2. Use ABAP Unit coverage services
3. Return branch and statement coverage metrics

**Input schema for `adt_get_coverage`:**

```json
{
  "type": "object",
  "properties": {
    "destination": { "type": "string" },
    "uri": { "type": "string" }
  },
  "required": ["destination", "uri"]
}
```

**Output schema:**

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "coverage": {
      "type": "object",
      "properties": {
        "percentage": { "type": "number" },
        "coveredLines": { "type": "number" },
        "totalLines": { "type": "number" },
        "branches": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "line": { "type": "number" },
              "covered": { "type": "boolean" }
            }
          }
        }
      }
    }
  }
}
```

**Estimated effort:** 2-3 days

## Phase 3: Utility and Metadata Tools (Low Priority)

### 3.1 Refresh Operations

**Tools to implement:**

- `adt_refresh_object` - Force refresh from server

**Estimated effort:** 0.5 day

### 3.2 Metadata Queries

**Tools to implement:**

- `adt_get_object_name` - Get object name from URI
- `adt_get_package_name` - Get package name from URI
- `adt_get_folder_uri` - Get folder URI for navigation
- `adt_get_external_links` - Get external links (e.g., ADT for Eclipse)

**Estimated effort:** 1 day total

### 3.3 Creation UI Support

**Tools to implement:**

- `adt_creation_ui_model` - Get UI model for creation dialog
- `adt_creation_side_effects` - Get side effects of creation

**Estimated effort:** 2 days

## Common Infrastructure

### URI Mapping

Create `AdtUriMapper` utility class to handle conversion between:

- LSP URIs (`abap://destination/path/to/object`)
- ADT URIs (`/sap/bc/adt/...`)
- File system paths

**Location:** `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/util/AdtUriMapper.java`

### Async Execution

Create `AsyncExecutor` utility to handle:

- Async method execution
- Progress monitoring
- Timeout handling
- Throttling

**Location:** `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/util/AsyncExecutor.java`

### Error Handling

Standardize error responses across all MCP tools:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Technical details"
  }
}
```

## Testing Strategy

### Unit Tests

- Mock ADT services for unit testing
- Test input/output schema validation
- Test error handling paths

### Integration Tests

- Use DEV fixture destination
- Test against real SAP system (if available)
- Test async operations and timeouts

### MCP Protocol Tests

- Test tool registration
- Test tool invocation
- Test structured responses

## Documentation

### MCP Tool Documentation

For each tool, document:

- Purpose and use cases
- Input/output schemas
- Error conditions
- Examples

### Developer Documentation

- Architecture overview
- Service factory patterns
- URI mapping conventions
- Async execution patterns

## Timeline

**Phase 1 (High Priority):** 3-4 weeks

- Week 1: ATC integration, object locking
- Week 2: code formatting, diagnostics
- Week 3: references, version toggle
- Week 4: transport management, repository search

**Phase 2 (Medium Priority):** 2-3 weeks

- Week 5: inactive objects, application run
- Week 6: hover, document symbols
- Week 7: transport search, code coverage

**Phase 3 (Low Priority):** 1 week

- Week 8: utility and metadata tools

**Total estimated effort:** 6-8 weeks

## Dependencies

- Existing MCP launcher infrastructure
- SAP ADT SDK services
- Destination configuration
- JCo native libraries

## Risks and Mitigations

### Risk: SDK Service Availability

**Mitigation:** Use fallback services or graceful degradation when services are not available

### Risk: Async Operation Timeouts

**Mitigation:** Implement configurable timeouts with retry logic

### Risk: URI Mapping Complexity

**Mitigation:** Comprehensive test coverage for URI conversion edge cases

### Risk: Server Overload

**Mitigation:** Implement throttling and rate limiting

## Success Criteria

- All Phase 1 tools implemented and tested
- MCP tools work with both HTTP and stdio modes
- Documentation complete for all implemented tools
- Integration tests passing
- Performance acceptable (operations complete within reasonable time)

## Next Steps

1. Review and approve this plan
2. Create detailed design for Phase 1 tools
3. Set up development environment with SAP system access
4. Begin implementation with ATC integration
5. Regular progress reviews at end of each week
