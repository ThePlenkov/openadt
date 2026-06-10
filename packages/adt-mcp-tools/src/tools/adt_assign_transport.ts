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
  destination: z
    .string()
    .describe('SAP destination id (SID_CLIENT_USER_LANG, e.g. ABC_200_USER_EN)'),
  uri: z
    .string()
    .describe(
      'Object URI (ADT path or repotree URI; use getLsUri after adt_quick_search when unsure)'
    ),
  transportId: z.string().describe('Transport request number to assign'),
})

export const adt_assign_transport = tool({
  name: 'adt_assign_transport',
  description:
    'Assign a transport to an ABAP object (adtLs/cts/transport/assignTransportToObject). Search transports first with adt_search_transports_simple.',
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
