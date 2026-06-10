/**
 * ADT LSP service contracts index.
 * Exports all service contracts organized by domain.
 * File structure matches LSP method paths: adtLs/fileSystem/forceRefresh.ts
 */

// Repository
import { quickSearch } from '@openadt/adt-services'

// Transport
import { searchTransportsSimple } from '@openadt/adt-services'
import { searchTransports } from '@openadt/adt-services'
import { checkTransportForObjectLock } from '@openadt/adt-services'
import { createTransportForObjectLock } from '@openadt/adt-services'
import { assignTransportToObject } from '@openadt/adt-services'

// Document symbol
import { documentSymbols } from '@openadt/adt-services'

// Application run
import { runApplication } from '@openadt/adt-services'

// References
import { findReferences } from '@openadt/adt-services'

// File system
import { forceRefresh } from '@openadt/adt-services'
import { getObjectName } from '@openadt/adt-services'
import { getPackageName } from '@openadt/adt-services'
import { getFolderUri } from '@openadt/adt-services'
import { getExternalLinks } from '@openadt/adt-services'
import { lockFile } from '@openadt/adt-services'
import { unlockFile } from '@openadt/adt-services'
import { getFileLockStatus } from '@openadt/adt-services'
import { toggleVersion } from '@openadt/adt-services'

// Hover
import { getHover } from '@openadt/adt-services'

// Format
import { formatting } from '@openadt/adt-services'

// Diagnostic
import { diagnostic } from '@openadt/adt-services'

// Coverage
import { getCoverage } from '@openadt/adt-services'
import { loadStatementResults } from '@openadt/adt-services'

// ATC
import { getCheckVariants } from '@openadt/adt-services'
import { runCheck as atcRunCheck } from '@openadt/adt-services'

// Activation
import { getInactiveObjects } from '@openadt/adt-services'

export { quickSearch }
export { searchTransportsSimple }
export { searchTransports }
export { checkTransportForObjectLock }
export { createTransportForObjectLock }
export { assignTransportToObject }
export { documentSymbols }
export { runApplication }
export { findReferences }
export { forceRefresh }
export { getObjectName }
export { getPackageName }
export { getFolderUri }
export { getExternalLinks }
export { lockFile }
export { unlockFile }
export { getFileLockStatus }
export { toggleVersion }
export { getHover }
export { formatting }
export { diagnostic }
export { getCoverage }
export { loadStatementResults }
export { getCheckVariants }
export { atcRunCheck as runCheck }
export { getInactiveObjects }

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
} as const
