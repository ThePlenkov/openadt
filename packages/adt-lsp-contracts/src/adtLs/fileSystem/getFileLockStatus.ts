/**
 * Get file lock status contract.
 * LSP method: adtLs/fileSystem/getFileLockStatus
 */
import { lspEndpoint, type, type LspEndpoint } from '../../lsp/contract-core'

export const getFileLockStatus: LspEndpoint = lspEndpoint({
  method: 'adtLs/fileSystem/getFileLockStatus',
  types: {
    params: type<{
      destination: string
      uri: string
    }>(),
    response: type<{
      locked: boolean
      lockedBy?: string
      lockedAt?: string
    }>(),
  },
})
