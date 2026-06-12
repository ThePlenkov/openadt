/**
 * Assign transport contract.
 * LSP method: adtLs/cts/transport/assignTransportToObject
 */
import { lspEndpoint, type, type LspEndpoint } from '../../../lsp/contract-core'

export const assignTransportToObject: LspEndpoint = lspEndpoint({
  method: 'adtLs/cts/transport/assignTransportToObject',
  types: {
    params: type<{
      objectUri: string
      transport: string
    }>(),
    response: type<{ success: boolean }>(),
  },
})
