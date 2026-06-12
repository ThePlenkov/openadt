/**
 * LSP method: textDocument/references
 */
import { lspEndpoint, type, type LspEndpoint } from '../lsp/contract-core'

export const references: LspEndpoint = lspEndpoint({
  method: 'textDocument/references',
  types: {
    params: type<{
      textDocument: {
        uri: string
      }
      position: {
        line: number
        character: number
      }
      context?: {
        includeDeclaration?: boolean
      }
    }>(),
    response:
      type<
        Array<{
          uri: string
          range: {
            start: { line: number; character: number }
            end: { line: number; character: number }
          }
        }>
      >(),
  },
})
