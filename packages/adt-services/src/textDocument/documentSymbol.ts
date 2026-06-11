/**
 * LSP method: textDocument/documentSymbol
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const documentSymbol: LspEndpoint = lspEndpoint({
  method: 'textDocument/documentSymbol',
  types: {
    params: type<{
      textDocument: {
        uri: string
      }
    }>(),
    response:
      type<
        Array<{
          name: string
          kind: number
          detail?: string
          range: {
            start: { line: number; character: number }
            end: { line: number; character: number }
          }
          selectionRange: {
            start: { line: number; character: number }
            end: { line: number; character: number }
          }
          children?: unknown[]
        }>
      >(),
  },
})
