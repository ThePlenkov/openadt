/**
 * MCP tool for assigning transport to object.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import { assignTransportToObject } from '@openadt/adt-services'
import type { LspTransport } from '@openadt/lsp-client'
import { callLspContract } from '@openadt/lsp-client'

// Zod schema (single source of truth)
const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z.string().describe('Object URI'),
  transportId: z.string().describe('Transport ID'),
})

// Tool definition for MCP SDK registration
export const adt_assign_transport = tool({
  name: 'adt_assign_transport',
  description: 'Assign a transport to an object',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const lspResult = await callLspContract(assignTransportToObject, transport, {
        destination: args.destination,
        uri: args.uri,
        transportId: args.transportId,
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
