/**
 * ADT MCP tool contracts and tool sets index.
 * Exports all MCP tool contracts organized by domain.
 */

// Repository
import { adt_quick_search } from "./tools/adt_quick_search.js";

// Transport
import { adt_search_transports_simple } from "./tools/adt_search_transports_simple.js";
import { adt_search_transports } from "./tools/adt_search_transports.js";
import { adt_check_transport_lock } from "./tools/adt_check_transport_lock.js";
import { adt_create_transport } from "./tools/adt_create_transport.js";
import { adt_assign_transport } from "./tools/adt_assign_transport.js";

// Document symbol
import { adt_document_symbols } from "./tools/adt_document_symbols.js";

// Application run
import { adt_run_application } from "./tools/adt_run_application.js";

// References
import { adt_find_references } from "./tools/adt_find_references.js";

// File system
import { adt_force_refresh } from "./tools/adt_force_refresh.js";
import { adt_get_object_name } from "./tools/adt_get_object_name.js";
import { adt_get_package_name } from "./tools/adt_get_package_name.js";
import { adt_get_folder_uri } from "./tools/adt_get_folder_uri.js";
import { adt_get_external_links } from "./tools/adt_get_external_links.js";
import { adt_lock_file } from "./tools/adt_lock_file.js";
import { adt_unlock_file } from "./tools/adt_unlock_file.js";
import { adt_get_file_lock_status } from "./tools/adt_get_file_lock_status.js";
import { adt_toggle_version } from "./tools/adt_toggle_version.js";

// Hover
import { adt_get_hover } from "./tools/adt_get_hover.js";

// Format
import { adt_format } from "./tools/adt_format.js";

// Diagnostic
import { adt_diagnostic } from "./tools/adt_diagnostic.js";

// Coverage
import { adt_get_coverage } from "./tools/adt_get_coverage.js";
import { adt_load_statement_results } from "./tools/adt_load_statement_results.js";

// ATC
import { adt_get_check_variants } from "./tools/adt_get_check_variants.js";
import { adt_run_check } from "./tools/adt_run_check.js";

// Activation
import { adt_get_inactive_objects } from "./tools/adt_get_inactive_objects.js";

// Tool sets
import { toolSets } from "./tool-sets/index.js";
import type { McpToolRegistry } from "../../mcp/client/registry.js";
import type { LspTransport } from "../../lsp/client/lsp-transport.js";

export { adt_quick_search };
export { adt_search_transports_simple };
export { adt_search_transports };
export { adt_check_transport_lock };
export { adt_create_transport };
export { adt_assign_transport };
export { adt_document_symbols };
export { adt_run_application };
export { adt_find_references };
export { adt_force_refresh };
export { adt_get_object_name };
export { adt_get_package_name };
export { adt_get_folder_uri };
export { adt_get_external_links };
export { adt_lock_file };
export { adt_unlock_file };
export { adt_get_file_lock_status };
export { adt_toggle_version };
export { adt_get_hover };
export { adt_format };
export { adt_diagnostic };
export { adt_get_coverage };
export { adt_load_statement_results };
export { adt_get_check_variants };
export { adt_run_check };
export { adt_get_inactive_objects };

/**
 * All MCP tool contracts organized by domain
 */
export const mcpTools = {
  repository: { adt_quick_search },
  transport: {
    adt_search_transports_simple,
    adt_search_transports,
    adt_check_transport_lock,
    adt_create_transport,
    adt_assign_transport,
  },
  documentSymbol: { adt_document_symbols },
  applicationRun: { adt_run_application },
  references: { adt_find_references },
  fileSystem: {
    adt_force_refresh,
    adt_get_object_name,
    adt_get_package_name,
    adt_get_folder_uri,
    adt_get_external_links,
    adt_lock_file,
    adt_unlock_file,
    adt_get_file_lock_status,
    adt_toggle_version,
  },
  hover: { adt_get_hover },
  format: { adt_format },
  diagnostic: { adt_diagnostic },
  coverage: { adt_get_coverage, adt_load_statement_results },
  atc: { adt_get_check_variants, adt_run_check },
  activation: { adt_get_inactive_objects },
} as const;

/**
 * Initialize MCP tool registry with all ADT tool sets.
 */
export function initializeMcpRegistry(registry: McpToolRegistry): void {
  for (const ToolSetClass of toolSets) {
    const toolSet = new ToolSetClass();
    toolSet.register(registry);
  }
}
