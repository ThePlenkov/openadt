import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { loadStatementResults } from '@openadt/adt-lsp-client'
import { toMcpError, toMcpJson } from '../mcp-result'

const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z.string().optional().describe('Object URI'),
  measurementId: z.string().optional().describe('Legacy measurement id alias for uri'),
})

export const adt_load_statement_results = tool({
  name: 'adt_load_statement_results',
  description: 'Load detailed statement coverage results',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      return toMcpJson(await loadStatementResults(transport, args))
    } catch (err) {
      return toMcpError(err)
    }
  },
})
