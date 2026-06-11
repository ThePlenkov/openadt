/**
 * Formatting contract.
 * LSP method: textDocument/formatting (standard LSP)
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const formatting: LspEndpoint = lspEndpoint({
  method: 'textDocument/formatting',
  types: {
    params: type<{
      textDocument: {
        uri: string
      }
      options?: {
        tabSize?: number
        insertSpaces?: boolean
      }
    }>(),
    response:
      type<
        Array<{
          range: {
            start: { line: number; character: number }
            end: { line: number; character: number }
          }
          newText: string
        }>
      >(),
  },
})
