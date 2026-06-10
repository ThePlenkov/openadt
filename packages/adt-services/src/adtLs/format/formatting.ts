/**
 * Formatting contract.
 * LSP method: adtLs/format/formatting
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const formatting: LspEndpoint = lspEndpoint({
  method: 'adtLs/format/formatting',
  types: {
    params: type<{
      destination: string
      uri: string
      content: string
    }>(),
    response: type<{
      success: boolean
      formattedContent: string
    }>(),
  },
})
