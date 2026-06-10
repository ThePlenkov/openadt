/**
 * ADT LSP service contracts index.
 * Exports all service contracts organized by domain.
 * File structure matches LSP method paths: adtLs/fileSystem/forceRefresh.ts
 */

// Repository
import { quickSearch } from "./services/adtLs/repository/quickSearch";

// Transport
import { searchTransportsSimple } from "./services/adtLs/transport/searchTransportsSimple";
import { searchTransports } from "./services/adtLs/transport/searchTransports";
import { checkTransportForObjectLock } from "./services/adtLs/transport/checkTransportForObjectLock";
import { createTransportForObjectLock } from "./services/adtLs/transport/createTransportForObjectLock";
import { assignTransportToObject } from "./services/adtLs/transport/assignTransportToObject";

// Document symbol
import { documentSymbols } from "./services/adtLs/documentSymbol/documentSymbols";

// Application run
import { runApplication } from "./services/adtLs/applicationRun/runApplication";

// References
import { findReferences } from "./services/adtLs/references/findReferences";

// File system
import { forceRefresh } from "./services/adtLs/fileSystem/forceRefresh";
import { getObjectName } from "./services/adtLs/fileSystem/getObjectName";
import { getPackageName } from "./services/adtLs/fileSystem/getPackageName";
import { getFolderUri } from "./services/adtLs/fileSystem/getFolderUri";
import { getExternalLinks } from "./services/adtLs/fileSystem/getExternalLinks";
import { lockFile } from "./services/adtLs/fileSystem/lockFile";
import { unlockFile } from "./services/adtLs/fileSystem/unlockFile";
import { getFileLockStatus } from "./services/adtLs/fileSystem/getFileLockStatus";
import { toggleVersion } from "./services/adtLs/fileSystem/toggleVersion";

// Hover
import { getHover } from "./services/adtLs/hover/getHover";

// Format
import { formatting } from "./services/adtLs/format/formatting";

// Diagnostic
import { diagnostic } from "./services/adtLs/diagnostic/diagnostic";

// Coverage
import { getCoverage } from "./services/adtLs/coverage/getCoverage";
import { loadStatementResults } from "./services/adtLs/coverage/loadStatementResults";

// ATC
import { getCheckVariants } from "./services/adtLs/atc/getCheckVariants";
import { runCheck as atcRunCheck } from "./services/adtLs/atc/runCheck";

// Activation
import { getInactiveObjects } from "./services/adtLs/activation/getInactiveObjects";

export { quickSearch };
export { searchTransportsSimple };
export { searchTransports };
export { checkTransportForObjectLock };
export { createTransportForObjectLock };
export { assignTransportToObject };
export { documentSymbols };
export { runApplication };
export { findReferences };
export { forceRefresh };
export { getObjectName };
export { getPackageName };
export { getFolderUri };
export { getExternalLinks };
export { lockFile };
export { unlockFile };
export { getFileLockStatus };
export { toggleVersion };
export { getHover };
export { formatting };
export { diagnostic };
export { getCoverage };
export { loadStatementResults };
export { getCheckVariants };
export { atcRunCheck as runCheck };
export { getInactiveObjects };

/**
 * All contracts organized by domain
 */
export const contracts = {
  repository: { quickSearch },
  transport: {
    searchTransportsSimple,
    searchTransports,
    checkTransportForObjectLock,
    createTransportForObjectLock,
    assignTransportToObject,
  },
  documentSymbol: { documentSymbols },
  applicationRun: { runApplication },
  references: { findReferences },
  fileSystem: {
    forceRefresh,
    getObjectName,
    getPackageName,
    getFolderUri,
    getExternalLinks,
    lockFile,
    unlockFile,
    getFileLockStatus,
    toggleVersion,
  },
  hover: { getHover },
  format: { formatting },
  diagnostic: { diagnostic },
  coverage: { getCoverage, loadStatementResults },
  atc: { getCheckVariants, runCheck: atcRunCheck },
  activation: { getInactiveObjects },
} as const;
