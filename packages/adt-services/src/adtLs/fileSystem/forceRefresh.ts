/**
 * Force refresh contract.
 * LSP method: adtLs/fileSystem/forceRefresh
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const forceRefresh: LspEndpoint = lspEndpoint({
  method: 'adtLs/fileSystem/forceRefresh',
  types: {
    params: type<{
      destination: string
      uri: string
    }>(),
    response: type<{ success: boolean }>(),
  },
})
