/**
 * Transport simple search contract.
 * LSP method: adtLs/transport/searchTransportsSimple
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const searchTransportsSimple: LspEndpoint = lspEndpoint({
  method: 'adtLs/transport/searchTransportsSimple',
  types: {
    params: type<{
      destination: string
      user?: string
      status?: 'modifiable' | 'released' | 'all'
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
