# ADT Test Scenarios

Test scenarios for the 26 OpenADT `adt_*` MCP tools.

## Overview

- **Location**: `e2e/scenarios-adt/`
- **Format**: Markdown with YAML frontmatter (same as existing MCP scenarios)
- **Codes**: `adt-1` through `adt-26`
- **Purpose**: Test OpenADT tools (scenario filtering only; launcher serves all tools)

## Running Tests

### Single Scenario

```bash
bun run mcp:e2e:adt -- --destination ABC_200_USER_EN --scenario adt-1
```

### All ADT Scenarios

```bash
bun run mcp:e2e:adt -- --destination ABC_200_USER_EN
```

### Sequential Execution (Fresh MCP Instance Per Scenario)

```bash
bun run mcp:e2e:adt:all -- --destination ABC_200_USER_EN
```

## Scenario List

| Code   | ID                      | Tool(s)                                                              | Type        |
| ------ | ----------------------- | -------------------------------------------------------------------- | ----------- |
| adt-1  | quick-search            | adt_quick_search                                                     | Individual  |
| adt-2  | transport-lock-check    | adt_check_transport_lock                                             | Individual  |
| adt-3  | transport-create        | adt_create_transport                                                 | Individual  |
| adt-4  | transport-assign        | adt_assign_transport                                                 | Individual  |
| adt-5  | transport-search-simple | adt_search_transports_simple                                         | Individual  |
| adt-6  | transport-search        | adt_search_transports                                                | Individual  |
| adt-7  | document-symbols        | adt_document_symbols                                                 | Individual  |
| adt-8  | run-application         | adt_run_application                                                  | Individual  |
| adt-9  | find-references         | adt_find_references                                                  | Individual  |
| adt-10 | force-refresh           | adt_force_refresh                                                    | Individual  |
| adt-11 | get-object-name         | adt_get_object_name                                                  | Individual  |
| adt-12 | get-package-name        | adt_get_package_name                                                 | Individual  |
| adt-13 | get-folder-uri          | adt_get_folder_uri                                                   | Individual  |
| adt-14 | get-external-links      | adt_get_external_links                                               | Individual  |
| adt-15 | lock-unlock-workflow    | adt_lock_file, adt_get_file_lock_status, adt_unlock_file             | Combination |
| adt-16 | get-hover               | adt_get_hover                                                        | Individual  |
| adt-17 | format                  | adt_format                                                           | Individual  |
| adt-18 | diagnostic              | adt_diagnostic                                                       | Individual  |
| adt-19 | get-coverage            | adt_get_coverage                                                     | Individual  |
| adt-20 | load-statement-results  | adt_load_statement_results                                           | Individual  |
| adt-21 | get-check-variants      | adt_get_check_variants                                               | Individual  |
| adt-22 | run-check               | adt_run_check                                                        | Individual  |
| adt-23 | atc-workflow            | adt_get_check_variants, adt_run_check, adt_load_statement_results    | Combination |
| adt-24 | get-inactive-objects    | adt_get_inactive_objects                                             | Individual  |
| adt-25 | transport-workflow      | adt_check_transport_lock, adt_create_transport, adt_assign_transport | Combination |
| adt-26 | search-read-workflow    | adt_quick_search, adt_get_folder_uri, adt_force_refresh              | Combination |

## Implementation Notes

- Uses existing `sap-adt-mcp-launcher` (serves all tools)
- Framework updated to support both `mcp-*` and `adt-*` scenario codes
- Scenarios loaded from both `scenarios/` (mcp) and `scenarios-adt/` (adt) directories
- Scenario filtering only (no `--no-proxy` flag; launcher serves all tools)
- Sequential runner ensures fresh MCP instance per scenario for isolation
