/**
 * Lock file contract.
 * LSP method: adtLs/fileSystem/lockFile
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const lockFile: LspEndpoint = lspEndpoint({
  method: 'adtLs/fileSystem/lockFile',
  types: {
    params: type<{
      destination: string
      uri: string
    }>(),
    response: type<{
      locked: boolean
      lockedBy?: string
    }>(),
  },
})
