/**
 * LSP method: adtLs/atc/runCheck
 */
import { lspEndpoint, type, type LspEndpoint } from '../../lsp/contract-core'

export const runCheck: LspEndpoint = lspEndpoint({
  method: 'adtLs/atc/runCheck',
  types: {
    params: type<{
      objectUri: string
      checkVariant: string
    }>(),
    response: type<{
      atcRunCheckResults: Array<{
        lineNumber: number
        priority: number
        location: string
        message: string
        checkId: string
        checkTitle: string
        checkClass: string
        messageId: string
      }>
    }>(),
  },
})
