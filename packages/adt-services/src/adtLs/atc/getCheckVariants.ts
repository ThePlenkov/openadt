/**
 * LSP method: adtLs/atc/getCheckVariants
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const getCheckVariants: LspEndpoint = lspEndpoint({
  method: 'adtLs/atc/getCheckVariants',
  types: {
    params: type<{
      objectUri: string
      quickPickUserInput?: string
    }>(),
    response: type<{
      checkVariants: Record<string, string>
    }>(),
  },
})
