/**
 * Transport advanced search contract.
 * LSP method: adtLs/cts/transport/searchTransports
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const searchTransports: LspEndpoint = lspEndpoint({
  method: 'adtLs/cts/transport/searchTransports',
  types: {
    params: type<{
      destination: string
      user?: string
      status?: 'modifiable' | 'released' | 'all'
      targetSystem?: string
      transportType?: string
    }>(),
    response: type<{
      success: boolean
      transports: Array<{
        id: string
        description: string
        owner: string
        status: string
        targetSystem: string
        type: string
      }>
    }>(),
  },
})
