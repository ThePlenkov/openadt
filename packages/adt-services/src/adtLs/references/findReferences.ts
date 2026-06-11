/**
 * Find references contract.
 * LSP method: textDocument/references (standard LSP)
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const findReferences: LspEndpoint = lspEndpoint({
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
