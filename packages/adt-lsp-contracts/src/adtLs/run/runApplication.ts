/**
 * LSP method: adtLs/run/runApplication
 * SAP signature: runApplication(String lsUriString)
 */
import { lspEndpoint, type, type LspEndpoint } from '../../lsp/contract-core'

export const runApplication: LspEndpoint = lspEndpoint({
  method: 'adtLs/run/runApplication',
  types: {
    params: type<string>(),
    response: type<string>(),
  },
})
