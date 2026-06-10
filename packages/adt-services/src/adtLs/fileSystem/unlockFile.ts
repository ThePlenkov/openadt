/**
 * Unlock file contract.
 * LSP method: adtLs/fileSystem/unlockFile
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const unlockFile: LspEndpoint = lspEndpoint({
  method: 'adtLs/fileSystem/unlockFile',
  types: {
    params: type<{
      destination: string
      uri: string
    }>(),
    response: type<{ unlocked: boolean }>(),
  },
})
