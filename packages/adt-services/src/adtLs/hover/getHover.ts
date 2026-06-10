/**
 * Get hover contract.
 * LSP method: adtLs/hover/getHover
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const getHover: LspEndpoint = lspEndpoint({
  method: 'adtLs/hover/getHover',
  types: {
    params: type<{
      destination: string
      uri: string
      position: {
        line: number
        character: number
      }
    }>(),
    response: type<{
      success: boolean
      documentation: string
    }>(),
  },
})
