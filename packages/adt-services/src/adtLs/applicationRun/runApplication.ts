/**
 * Application run contract.
 * LSP method: adtLs/applicationRun/runApplication
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const runApplication: LspEndpoint = lspEndpoint({
  method: 'adtLs/applicationRun/runApplication',
  types: {
    params: type<{
      destination: string
      uri: string
    }>(),
    response: type<{
      success: boolean
      output: string
      exitCode?: number
    }>(),
  },
})
