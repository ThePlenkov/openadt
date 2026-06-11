/**
 * Application run contract.
 * LSP method: adtLs/run/runApplication
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const runApplication: LspEndpoint = lspEndpoint({
  method: 'adtLs/run/runApplication',
  types: {
    params: type<{ uri: string }>(),
    response: type<string>(),
  },
})
