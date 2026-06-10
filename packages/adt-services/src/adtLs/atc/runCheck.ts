/**
 * Run check contract.
 * LSP method: adtLs/atc/runCheck
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const runCheck: LspEndpoint = lspEndpoint({
  method: 'adtLs/atc/runCheck',
  types: {
    params: type<{
      destination: string
      uris: string[]
      variant?: string
    }>(),
    response: type<{
      success: boolean
      findings: unknown[]
    }>(),
  },
})
