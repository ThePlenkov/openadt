/**
 * MCP tool for adt load statement results.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod'
import { tool } from '../tool-factory.js'
import { loadStatementResults } from '../../services/adtLs/coverage/loadStatementResults.js'
import type { LspTransport } from '../../../lsp/client/lsp-transport.js'
import { callLspContract } from '../../../lsp/client/call-lsp-contract.js'

// Zod schema (single source of truth)
const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z.string().describe('Object URI'),
})

// Tool definition for MCP SDK registration
export const adt_load_statement_results = tool({
  name: 'adt_load_statement_results',
  description: 'Load detailed statement coverage results',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const lspResult = await callLspContract(loadStatementResults, transport, {
        destination: args.destination,
        uri: args.uri,
      })

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(lspResult, null, 2),
          },
        ],
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${message}`,
          },
        ],
        isError: true,
      }
    }
  },
})
