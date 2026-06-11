/**
 * Transport simple search contract.
 * LSP method: adtLs/cts/transport/searchTransportsSimple
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const searchTransportsSimple: LspEndpoint = lspEndpoint({
  method: 'adtLs/cts/transport/searchTransportsSimple',
  types: {
    params: type<{
      destinationId: string
      owner: string
      function: string
    }>(),
    response: type<{
      success: boolean
      transports: Array<{
        id: string
        description: string
        owner: string
        status: string
        targetSystem: string
      }>
    }>(),
  },
})
