/**
 * Toggle version contract.
 * LSP method: adtLs/fileSystem/toggleVersion
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const toggleVersion: LspEndpoint = lspEndpoint({
  method: 'adtLs/fileSystem/toggleVersion',
  types: {
    params: type<{
      destination: string
      uri: string
    }>(),
    response: type<{
      success: boolean
      isActive: boolean
    }>(),
  },
})
