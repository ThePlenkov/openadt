/**
 * Get object name contract.
 * LSP method: adtLs/fileSystem/getObjectName
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const getObjectName: LspEndpoint = lspEndpoint({
  method: 'adtLs/fileSystem/getObjectName',
  types: {
    params: type<{
      destination: string
      uri: string
    }>(),
    response: type<{ success: boolean; name: string }>(),
  },
})
