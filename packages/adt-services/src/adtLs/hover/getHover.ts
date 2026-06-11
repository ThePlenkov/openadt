/**
 * Get hover contract.
 * LSP method: textDocument/hover (standard LSP)
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const getHover: LspEndpoint = lspEndpoint({
  method: 'textDocument/hover',
  types: {
    params: type<{
      textDocument: {
        uri: string
      }
      position: {
        line: number
        character: number
      }
    }>(),
    response: type<{
      contents:
        | string
        | { language: string; value: string }
        | Array<string | { language: string; value: string }>
      range?: {
        start: { line: number; character: number }
        end: { line: number; character: number }
      }
    } | null>(),
  },
})
