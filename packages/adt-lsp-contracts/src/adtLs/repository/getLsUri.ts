/**
 * Get LSP URI contract.
 * LSP method: adtLs/repository/getLsUri
 */
import { lspEndpoint, type, type LspEndpoint } from '../../lsp/contract-core'

export const getLsUri: LspEndpoint = lspEndpoint({
  method: 'adtLs/repository/getLsUri',
  types: {
    params: type<{
      destination: string
      uri: string
    }>(),
    response: type<{ uri: string }>(),
  },
})
