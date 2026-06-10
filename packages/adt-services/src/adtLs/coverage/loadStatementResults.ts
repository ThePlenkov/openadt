/**
 * Load statement results contract.
 * LSP method: adtLs/coverage/loadStatementResults
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const loadStatementResults: LspEndpoint = lspEndpoint({
  method: 'adtLs/coverage/loadStatementResults',
  types: {
    params: type<{
      destination: string
      uri: string
    }>(),
    response: type<{
      success: boolean
      statements: Array<{
        line: number
        covered: boolean
        executions?: number
      }>
    }>(),
  },
})
