/**
 * MCP tool for adt search transports.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import { searchTransports } from '@openadt/adt-services'
import type { LspTransport } from '@openadt/lsp-client'
import { callLspContract } from '@openadt/lsp-client'

// Zod schema (single source of truth)
const schema = z.object({
  destination: z
    .string()
    .describe('SAP destination id (SID_CLIENT_USER_LANG, e.g. ABC_200_USER_EN)'),
  number: z.string().optional().describe('Transport number filter (optional)'),
  owner: z.string().optional().describe('Owner filter (optional)'),
  function: z.array(z.string()).optional().describe('Function filter (optional)'),
  status: z.array(z.string()).optional().describe('Status filter (optional)'),
  fromDate: z.string().optional().describe('From date filter (optional)'),
  toDate: z.string().optional().describe('To date filter (optional)'),
  limit: z.number().optional().describe('Limit results (optional)'),
})

export const adt_search_transports = tool({
  name: 'adt_search_transports',
  description:
    'Advanced ABAP transport search (adtLs/cts/transport/searchTransports). Prefer adt_search_transports_simple for listing modifiable transports.',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const lspResult = await callLspContract(searchTransports, transport, {
        destinationId: args.destination,
        number: args.number,
        owner: args.owner,
        function: args.function,
        status: args.status,
        fromDate: args.fromDate,
        toDate: args.toDate,
        limit: args.limit,
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
