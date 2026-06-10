/**
 * Assign transport contract.
 * LSP method: adtLs/transport/assignTransportToObject
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const assignTransportToObject: LspEndpoint = lspEndpoint({
  method: 'adtLs/transport/assignTransportToObject',
  types: {
    params: type<{
      destination: string
      uri: string
      transportId: string
    }>(),
    response: type<{ success: boolean }>(),
  },
})
