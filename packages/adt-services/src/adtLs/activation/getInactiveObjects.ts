/**
 * Get inactive objects contract.
 * LSP method: adtLs/activation/getInactiveObjects
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const getInactiveObjects: LspEndpoint = lspEndpoint({
  method: 'adtLs/activation/getInactiveObjects',
  types: {
    params: type<{
      destination: string
      package?: string
      objectType?: string
    }>(),
    response: type<{
      success: boolean
      objects: Array<{
        name: string
        type: string
        uri: string
        package?: string
      }>
    }>(),
  },
})
