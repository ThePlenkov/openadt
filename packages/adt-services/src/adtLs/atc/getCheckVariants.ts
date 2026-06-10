/**
 * Get check variants contract.
 * LSP method: adtLs/atc/getCheckVariants
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const getCheckVariants: LspEndpoint = lspEndpoint({
  method: 'adtLs/atc/getCheckVariants',
  types: {
    params: type<{
      destination: string
    }>(),
    response: type<string[]>(),
  },
})
