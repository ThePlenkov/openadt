/**
 * ADT MCP tool contracts index.
 * Exports all MCP tool contracts organized by domain.
 */

// Repository
import { adtQuickSearch } from "./tools/adt_quick_search.js";

// Transport
import { adtSearchTransportsSimple } from "./tools/adt_search_transports_simple.js";
import { adtSearchTransports } from "./tools/adt_search_transports.js";
import { adtCheckTransportLock } from "./tools/adt_check_transport_lock.js";
import { adtCreateTransport } from "./tools/adt_create_transport.js";
import { adtAssignTransport } from "./tools/adt_assign_transport.js";

// Document symbol
import { adtDocumentSymbols } from "./tools/adt_document_symbols.js";

// Application run
import { adtRunApplication } from "./tools/adt_run_application.js";

// References
import { adtFindReferences } from "./tools/adt_find_references.js";

// File system
import { adtForceRefresh } from "./tools/adt_force_refresh.js";
import { adtGetObjectName } from "./tools/adt_get_object_name.js";
import { adtGetPackageName } from "./tools/adt_get_package_name.js";
import { adtGetFolderUri } from "./tools/adt_get_folder_uri.js";
import { adtGetExternalLinks } from "./tools/adt_get_external_links.js";
import { adtLockFile } from "./tools/adt_lock_file.js";
import { adtUnlockFile } from "./tools/adt_unlock_file.js";
import { adtGetFileLockStatus } from "./tools/adt_get_file_lock_status.js";
import { adtToggleVersion } from "./tools/adt_toggle_version.js";

// Hover
import { adtGetHover } from "./tools/adt_get_hover.js";

// Format
import { adtFormat } from "./tools/adt_format.js";

// Diagnostic
import { adtDiagnostic } from "./tools/adt_diagnostic.js";

// Coverage
import { adtGetCoverage } from "./tools/adt_get_coverage.js";
import { adtLoadStatementResults } from "./tools/adt_load_statement_results.js";

// ATC
import { adtGetCheckVariants } from "./tools/adt_get_check_variants.js";
import { adtRunCheck } from "./tools/adt_run_check.js";

// Activation
import { adtGetInactiveObjects } from "./tools/adt_get_inactive_objects.js";

export { adtQuickSearch };
export { adtSearchTransportsSimple };
export { adtSearchTransports };
export { adtCheckTransportLock };
export { adtCreateTransport };
export { adtAssignTransport };
export { adtDocumentSymbols };
export { adtRunApplication };
export { adtFindReferences };
export { adtForceRefresh };
export { adtGetObjectName };
export { adtGetPackageName };
export { adtGetFolderUri };
export { adtGetExternalLinks };
export { adtLockFile };
export { adtUnlockFile };
export { adtGetFileLockStatus };
export { adtToggleVersion };
export { adtGetHover };
export { adtFormat };
export { adtDiagnostic };
export { adtGetCoverage };
export { adtLoadStatementResults };
export { adtGetCheckVariants };
export { adtRunCheck };
export { adtGetInactiveObjects };

/**
 * All MCP tool contracts organized by domain
 */
export const mcpTools = {
  repository: { adtQuickSearch },
  transport: {
    adtSearchTransportsSimple,
    adtSearchTransports,
    adtCheckTransportLock,
    adtCreateTransport,
    adtAssignTransport,
  },
  documentSymbol: { adtDocumentSymbols },
  applicationRun: { adtRunApplication },
  references: { adtFindReferences },
  fileSystem: {
    adtForceRefresh,
    adtGetObjectName,
    adtGetPackageName,
    adtGetFolderUri,
    adtGetExternalLinks,
    adtLockFile,
    adtUnlockFile,
    adtGetFileLockStatus,
    adtToggleVersion,
  },
  hover: { adtGetHover },
  format: { adtFormat },
  diagnostic: { adtDiagnostic },
  coverage: { adtGetCoverage, adtLoadStatementResults },
  atc: { adtGetCheckVariants, adtRunCheck },
  activation: { adtGetInactiveObjects },
} as const;
