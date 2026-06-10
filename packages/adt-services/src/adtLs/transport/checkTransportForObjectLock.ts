/**
 * Check transport lock contract.
 * LSP method: adtLs/transport/checkTransportForObjectLock
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const checkTransportForObjectLock: LspEndpoint = lspEndpoint({
  method: 'adtLs/transport/checkTransportForObjectLock',
  types: {
    params: type<{
      destination: string
      uri: string
    }>(),
    response: type<{
      requiresTransport: boolean
      transportId?: string
    }>(),
  },
})
