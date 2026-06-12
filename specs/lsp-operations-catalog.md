# LSP Operations Catalog

This document catalogs all LSP operations available in the SAP ADT Language Server (VS Code extension) and maps them to MCP tool equivalents for implementation in OpenADT.

## Source

Based on analysis of SAP ADT Language Server extension architecture and public ADT service interfaces.

## Already Implemented in SAP MCP

The following MCP tools are already implemented in the official SAP MCP server:

| MCP Tool                      | Class                                 | Purpose                             |
| ----------------------------- | ------------------------------------- | ----------------------------------- |
| `adt_activation`              | `AbapActivationMcpTool`               | Activate ABAP objects               |
| `adt_abap_unit_run`           | `AbapUnitRunMcpTool`                  | Run ABAP Unit tests                 |
| `adt_creatable_objects`       | `AbapCreatableObjectsAdtMCPTool`      | Get list of creatable object types  |
| `adt_creatable_single_object` | `AbapCreatableSingleObjectAdtMCPTool` | Create a single ABAP object         |
| `adt_creatable_validation`    | `AbapCreatableValidationAdtMCPTool`   | Validate object creation parameters |
| `adt_creatable_creation`      | `AbapCreatableCreationAdtMCPTool`     | Execute object creation             |

## LSP Extensions to Implement as MCP Tools

### 1. Activation Extension (`AdtLsActivationExtension`)

| LSP Method             | Purpose                                 | MCP Tool Name              | Priority          |
| ---------------------- | --------------------------------------- | -------------------------- | ----------------- |
| `activate()`           | Activate one or more ABAP objects       | `adt_activate`             | ✅ Already exists |
| `getInactiveObjects()` | Get list of inactive objects in request | `adt_get_inactive_objects` | Medium            |

**Implementation Notes:**

- `activate()` is already covered by `adt_activation` MCP tool
- `getInactiveObjects()` returns list of `AdtObjectReference` for inactive objects

### 2. ATC Extension (`AdtLsAtcExtension`)

| LSP Method           | Purpose                                | MCP Tool Name          | Priority |
| -------------------- | -------------------------------------- | ---------------------- | -------- |
| `runCheck()`         | Run ABAP Test Cockpit check on objects | `adt_atc_run_check`    | High     |
| `getCheckVariants()` | Get available ATC check variants       | `adt_atc_get_variants` | High     |

**Implementation Notes:**

- ATC (ABAP Test Cockpit) is critical for code quality
- Returns `AtcRunCheckResponse` with check results
- Check variants determine which checks to run

### 3. Application Run Extension (`AdtLsApplicationRunExtension`)

| LSP Method         | Purpose                        | MCP Tool Name         | Priority |
| ------------------ | ------------------------------ | --------------------- | -------- |
| `runApplication()` | Run ABAP application (console) | `adt_run_application` | Medium   |

**Implementation Notes:**

- Supports running classes and programs in console mode
- Returns console output as string
- Similar to VS Code "Run ABAP Application" command

### 4. Object Creation Extension (`AdtLsObjectCreationExtension`)

| LSP Method                       | Purpose                                    | MCP Tool Name               | Priority          |
| -------------------------------- | ------------------------------------------ | --------------------------- | ----------------- |
| `getCreatableObjectTypes()`      | Get creatable object types for destination | `adt_creatable_objects`     | ✅ Already exists |
| `getCreationUiModelAndContent()` | Get UI model for object creation dialog    | `adt_creation_ui_model`     | Low               |
| `validate()`                     | Validate object creation parameters        | `adt_creatable_validation`  | ✅ Already exists |
| `create()`                       | Create ABAP object                         | `adt_creatable_creation`    | ✅ Already exists |
| `sideEffects()`                  | Get side effects of object creation        | `adt_creation_side_effects` | Low               |

**Implementation Notes:**

- Core creation operations already covered by existing MCP tools
- `getCreationUiModelAndContent` is for UI rendering (lower priority for CLI/MCP)
- `sideEffects` returns additional actions after creation (e.g., transport requests)

### 5. File System Extension (`AdtLsFileSystemExtension`)

| LSP Method            | Purpose                                    | MCP Tool Name            | Priority |
| --------------------- | ------------------------------------------ | ------------------------ | -------- |
| `toggleVersion()`     | Toggle between active/inactive version     | `adt_toggle_version`     | High     |
| `lockFile()`          | Lock object for editing                    | `adt_lock_object`        | High     |
| `unlockFile()`        | Unlock object                              | `adt_unlock_object`      | High     |
| `getFileLockStatus()` | Get lock status of object                  | `adt_get_lock_status`    | Medium   |
| `getObjectName()`     | Get object name from URI                   | `adt_get_object_name`    | Low      |
| `getPackageName()`    | Get package name from URI                  | `adt_get_package_name`   | Low      |
| `forceRefresh()`      | Force refresh of object from server        | `adt_refresh_object`     | Medium   |
| `getFolderUri()`      | Get folder URI for navigation              | `adt_get_folder_uri`     | Low      |
| `getExternalLinks()`  | Get external links (e.g., ADT for Eclipse) | `adt_get_external_links` | Low      |

**Implementation Notes:**

- Lock/unlock are critical for collaborative development
- Toggle version is important for viewing inactive code
- These map to VS Code commands: Lock, Unlock, Toggle Version, Refresh

### 6. Text Document Extension (`AdtLsTextDocumentExtension`)

| LSP Method           | Purpose                         | MCP Tool Name  | Priority |
| -------------------- | ------------------------------- | -------------- | -------- |
| `notifyDirtyState()` | Notify server of dirty state    | N/A (LSP-only) | N/A      |
| `insertProposal()`   | Insert code completion proposal | N/A (LSP-only) | N/A      |

**Implementation Notes:**

- These are LSP-specific operations, not suitable for MCP tools
- LSP handles document synchronization natively

### 7. References (`AdtLsReferences`)

| LSP Method         | Purpose                              | MCP Tool Name         | Priority |
| ------------------ | ------------------------------------ | --------------------- | -------- |
| `findReferences()` | Find all usages/references of object | `adt_find_references` | High     |

**Implementation Notes:**

- Critical for code navigation and impact analysis
- Returns list of `Location` objects with file paths and ranges
- Uses RIS (Repository Information System) backend

### 8. Hover Service (`AbapLsHoverService`)

| LSP Method   | Purpose                         | MCP Tool Name   | Priority |
| ------------ | ------------------------------- | --------------- | -------- |
| `getHover()` | Get hover information for token | `adt_get_hover` | Medium   |

**Implementation Notes:**

- Returns markdown-formatted documentation
- Useful for understanding code without opening in editor
- Uses `ICodeElementInformationBackendService`

### 9. Diagnostic Service (`AdtLsDiagnosticService`)

| LSP Method     | Purpose                              | MCP Tool Name         | Priority |
| -------------- | ------------------------------------ | --------------------- | -------- |
| `diagnostic()` | Get syntax/check errors for document | `adt_get_diagnostics` | High     |

**Implementation Notes:**

- Returns `DocumentDiagnosticReport` with errors, warnings, info
- Critical for CI/CD integration
- Supports throttling to avoid overwhelming server

### 10. Code Completion Service (`AbapLsCodeCompletionService`)

| LSP Method            | Purpose                         | MCP Tool Name  | Priority |
| --------------------- | ------------------------------- | -------------- | -------- |
| `completion()`        | Get code completion suggestions | N/A (LSP-only) | N/A      |
| `resolveCompletion()` | Resolve completion item details | N/A (LSP-only) | N/A      |

**Implementation Notes:**

- LSP-specific, requires real-time editor context
- Not suitable for MCP tool (stateful, editor-dependent)

### 11. Document Symbol Service (`AbapLsDocumentSymbolService`)

| LSP Method          | Purpose                          | MCP Tool Name          | Priority |
| ------------------- | -------------------------------- | ---------------------- | -------- |
| `documentSymbols()` | Get document structure (outline) | `adt_document_symbols` | Medium   |

**Implementation Notes:**

- Returns hierarchical symbol tree (classes, methods, variables)
- Useful for code analysis and documentation generation
- Maps to VS Code "Outline" view

### 12. Document Highlight Service (`AbapLsDocumentHighlightService`)

| LSP Method             | Purpose                            | MCP Tool Name  | Priority |
| ---------------------- | ---------------------------------- | -------------- | -------- |
| `documentHighlights()` | Highlight all occurrences of token | N/A (LSP-only) | N/A      |

**Implementation Notes:**

- LSP-specific, requires editor context
- Similar to `findReferences` but for current document only

### 13. Format Service (`AbapLsFormatService`)

| LSP Method     | Purpose          | MCP Tool Name     | Priority |
| -------------- | ---------------- | ----------------- | -------- |
| `formatting()` | Format ABAP code | `adt_format_code` | High     |

**Implementation Notes:**

- Uses `IGenericPrettyPrinterService`
- Critical for code style consistency
- Supports ABAP, DDL, DDLA, SRVD, BSCE formats

### 14. Code Lens Service (`JsonLsCodeLensService`)

| LSP Method   | Purpose                          | MCP Tool Name  | Priority |
| ------------ | -------------------------------- | -------------- | -------- |
| `codeLens()` | Get code lenses (editor actions) | N/A (LSP-only) | N/A      |

**Implementation Notes:**

- LSP-specific, requires editor context
- Provides in-editor actions (e.g., "Run Test" above test method)

### 15. Debugger Extension (`AdtLsDebuggerExtension`)

| LSP Method                     | Purpose                        | MCP Tool Name  | Priority |
| ------------------------------ | ------------------------------ | -------------- | -------- |
| `onBreakpointChangedRequest()` | Sync breakpoints with debugger | N/A (LSP-only) | N/A      |
| `initializeDebugger()`         | Initialize debugger session    | N/A (LSP-only) | N/A      |

**Implementation Notes:**

- LSP-specific, requires real-time debugger protocol
- Uses Debug Adapter Protocol (DAP)
- Not suitable for MCP tools (stateful, session-based)

### 16. Transport Extension (`AdtLsTransportExtension`)

| LSP Method                       | Purpose                          | MCP Tool Name                    | Priority |
| -------------------------------- | -------------------------------- | -------------------------------- | -------- |
| `checkTransportForObjectLock()`  | Check transport for object lock  | `adt_check_transport_lock`       | High     |
| `createTransportForObjectLock()` | Create transport for object lock | `adt_create_transport`           | High     |
| `assignTransportToObject()`      | Assign transport to object       | `adt_assign_transport`           | High     |
| `searchTransportsSimple()`       | Simple search for transports     | `adt_search_transports`          | Medium   |
| `searchTransports()`             | Advanced search for transports   | `adt_search_transports_advanced` | Medium   |

**Implementation Notes:**

- Critical for SAP transport management
- Transport requests are required for moving code between systems
- Supports workbench and customizing transports

### 17. Repository Extension (`AdtLsRepositoryExtension`)

| LSP Method      | Purpose                    | MCP Tool Name      | Priority |
| --------------- | -------------------------- | ------------------ | -------- |
| `getUsers()`    | Get users for repository   | `adt_get_users`    | Low      |
| `getLsUri()`    | Get LSP URI for ADT object | `adt_get_ls_uri`   | Low      |
| `quickSearch()` | Quick search in repository | `adt_quick_search` | High     |

**Implementation Notes:**

- `quickSearch` is critical for object discovery
- Uses RIS (Repository Information System) for search
- Returns object references with URIs

### 18. Coverage Extension (`AdtCoverageExtension`)

| LSP Method               | Purpose                       | MCP Tool Name                 | Priority |
| ------------------------ | ----------------------------- | ----------------------------- | -------- |
| `getCoverage()`          | Get code coverage data        | `adt_get_coverage`            | Medium   |
| `loadStatementResults()` | Load statement-level coverage | `adt_load_statement_coverage` | Medium   |

**Implementation Notes:**

- Used with ABAP Unit tests
- Returns branch and statement coverage
- Supports coverage visualization

### 19. AFF Adapters (Application File Format)

**Purpose:** Handle specific ABAP object types with custom file formats

| Adapter          | Object Type         | Purpose                | MCP Tool Name  | Priority |
| ---------------- | ------------------- | ---------------------- | -------------- | -------- |
| `BdefAffAdapter` | Behavior Definition | Handle BDEF files      | N/A (LSP-only) | N/A      |
| `ClasAffAdapter` | Class               | Handle class files     | N/A (LSP-only) | N/A      |
| `IntfAffAdapter` | Interface           | Handle interface files | N/A (LSP-only) | N/A      |
| `DdlaAffAdapter` | DDL Annotation      | Handle DDLA files      | N/A (LSP-only) | N/A      |
| `DdlsAffAdapter` | DDL Source          | Handle DDLS files      | N/A (LSP-only) | N/A      |
| `SrvbAffAdapter` | Service Binding     | Handle SRVB files      | N/A (LSP-only) | N/A      |
| `SrvdAffAdapter` | Service Definition  | Handle SRVD files      | N/A (LSP-only) | N/A      |

**Implementation Notes:**

- AFF adapters are LSP-specific for file content mapping
- Handle conversion between ABAP objects and file formats
- Not suitable for MCP tools (editor-specific)

## Summary: New MCP Tools to Implement

### High Priority

1. `adt_atc_run_check` - Run ATC checks
2. `adt_atc_get_variants` - Get ATC check variants
3. `adt_toggle_version` - Toggle active/inactive version
4. `adt_lock_object` - Lock object
5. `adt_unlock_object` - Unlock object
6. `adt_find_references` - Find object usages
7. `adt_get_diagnostics` - Get syntax/check errors
8. `adt_format_code` - Format ABAP code
9. `adt_check_transport_lock` - Check transport for object lock
10. `adt_create_transport` - Create transport for object lock
11. `adt_assign_transport` - Assign transport to object
12. `adt_quick_search` - Quick search in repository

### Medium Priority

13. `adt_get_inactive_objects` - Get inactive objects
14. `adt_run_application` - Run ABAP application
15. `adt_get_lock_status` - Get lock status
16. `adt_refresh_object` - Force refresh
17. `adt_get_hover` - Get hover information
18. `adt_document_symbols` - Get document structure
19. `adt_search_transports` - Simple search for transports
20. `adt_search_transports_advanced` - Advanced search for transports
21. `adt_get_coverage` - Get code coverage data
22. `adt_load_statement_coverage` - Load statement-level coverage

### Low Priority

23. `adt_creation_ui_model` - Get creation UI model
24. `adt_creation_side_effects` - Get creation side effects
25. `adt_get_object_name` - Get object name
26. `adt_get_package_name` - Get package name
27. `adt_get_folder_uri` - Get folder URI
28. `adt_get_external_links` - Get external links
29. `adt_get_users` - Get users for repository
30. `adt_get_ls_uri` - Get LSP URI for ADT object

## Implementation Strategy

1. **Phase 1 (High Priority)**: Implement core development tools (ATC, lock/unlock, format, diagnostics, references, transport management, repository search)
2. **Phase 2 (Medium Priority)**: Add navigation and analysis tools (toggle version, hover, symbols, coverage, transport search)
3. **Phase 3 (Low Priority)**: Add utility and metadata tools

## Technical Notes

- All LSP extensions use `AdtLsAsyncHelper.runAsync()` for async execution
- Services are created via factory pattern (e.g., `AdtSourceServicesFactory.createInstance()`)
- URI mapping between LSP URIs and ADT URIs is handled by `AdtLsUriUtil`
- Progress monitoring uses `IProgressMonitor` for long-running operations
- Throttling is implemented in `AdtLsThrottler` to avoid server overload
