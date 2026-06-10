/**
 * ADT MCP tools index.
 * Exports all MCP tools using MCP SDK pattern with Zod schemas.
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

export {
  adt_quick_search,
  adt_search_transports_simple,
  adt_search_transports,
  adt_check_transport_lock,
  adt_create_transport,
  adt_assign_transport,
  adt_document_symbols,
  adt_run_application,
  adt_find_references,
  adt_force_refresh,
  adt_get_object_name,
  adt_get_package_name,
  adt_get_folder_uri,
  adt_get_external_links,
  adt_lock_file,
  adt_unlock_file,
  adt_get_file_lock_status,
  adt_toggle_version,
  adt_get_hover,
  adt_format,
  adt_diagnostic,
  adt_get_coverage,
  adt_load_statement_results,
  adt_get_check_variants,
  adt_run_check,
  adt_get_inactive_objects,
};

/**
 * All MCP tools for easy registration with MCP SDK server.
 */
export const mcpTools = [
  adt_quick_search,
  adt_search_transports_simple,
  adt_search_transports,
  adt_check_transport_lock,
  adt_create_transport,
  adt_assign_transport,
  adt_document_symbols,
  adt_run_application,
  adt_find_references,
  adt_force_refresh,
  adt_get_object_name,
  adt_get_package_name,
  adt_get_folder_uri,
  adt_get_external_links,
  adt_lock_file,
  adt_unlock_file,
  adt_get_file_lock_status,
  adt_toggle_version,
  adt_get_hover,
  adt_format,
  adt_diagnostic,
  adt_get_coverage,
  adt_load_statement_results,
  adt_get_check_variants,
  adt_run_check,
  adt_get_inactive_objects,
];

