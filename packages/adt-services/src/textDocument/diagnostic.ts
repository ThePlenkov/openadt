/**
 * LSP method: textDocument/diagnostic
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const diagnostic: LspEndpoint = lspEndpoint({
  method: 'textDocument/diagnostic',
  types: {
    params: type<{
      textDocument: {
        uri: string
      }
    }>(),
    response: type<{
      kind: 'full' | 'unchanged'
      items?: Array<{
        severity?: number
        message: string
        range: {
          start: { line: number; character: number }
          end: { line: number; character: number }
        }
      }>
    }>(),
  },
})
