/**
 * Create transport contract.
 * LSP method: adtLs/transport/createTransportForObjectLock
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const createTransportForObjectLock: LspEndpoint = lspEndpoint({
  method: 'adtLs/transport/createTransportForObjectLock',
  types: {
    params: type<{
      destination: string
      uri: string
      transportType: 'workbench' | 'customizing'
      description?: string
    }>(),
    response: type<{
      success: boolean
      transportId: string
    }>(),
  },
})
