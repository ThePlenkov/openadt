/**
 * Diagnostic contract.
 * LSP method: adtLs/diagnostic/diagnostic
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const diagnostic: LspEndpoint = lspEndpoint({
  method: 'adtLs/diagnostic/diagnostic',
  types: {
    params: type<{
      destination: string
      uri: string
    }>(),
    response: type<{
      success: boolean
      diagnostics: Array<{
        severity: 'error' | 'warning' | 'info'
        message: string
        range: {
          start: { line: number; character: number }
          end: { line: number; character: number }
        }
      }>
    }>(),
  },
})
