/**
 * Get coverage contract.
 * LSP method: adtLs/coverage/getCoverage
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const getCoverage: LspEndpoint = lspEndpoint({
  method: 'adtLs/coverage/getCoverage',
  types: {
    params: type<{
      destination: string
      uri: string
    }>(),
    response: type<{
      success: boolean
      coverage: {
        percentage: number
        coveredLines: number
        totalLines: number
        branches?: Array<{ line: number; covered: boolean }>
      }
    }>(),
  },
})
