/**
 * LSP method: adtLs/run/runApplication
 * SAP signature: runApplication(String lsUriString)
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const runApplication: LspEndpoint = lspEndpoint({
  method: 'adtLs/run/runApplication',
  types: {
    params: type<string>(),
    response: type<string>(),
  },
})
