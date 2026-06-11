/**
 * MCP tool for assigning transport to object.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import { assignTransportToObject } from '@openadt/adt-services'
import type { LspTransport } from '@openadt/lsp-client'
import { callLspContract } from '@openadt/lsp-client'

const LSP_METHOD_REPOSITORY_GET_LS_URI = 'adtLs/repository/getLsUri'

// Zod schema (single source of truth)
const schema = z.object({
  destination: z
    .string()
    .describe('SAP destination id (SID_CLIENT_USER_LANG, e.g. ABC_200_USER_EN)'),
  uri: z
    .string()
    .describe(
      'ADT object path from adt_quick_search (e.g. /sap/bc/adt/oo/classes/cl_x); tool resolves repotree URI via getLsUri'
    ),
  transportId: z.string().describe('Transport request number to assign'),
})

export const adt_assign_transport = tool({
  name: 'adt_assign_transport',
  description:
    'Assign an ABAP object to a transport request (adtLs/cts/transport/assignTransportToObject). This tool calls getLsUri internally to resolve the repotree URI; do NOT call adt_get_ls_uri first. Pass ADT path from adt_quick_search as uri. Search for available transports first with adt_search_transports_simple to get a valid transportId.',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const lsUriResult = (await transport.sendRequest(LSP_METHOD_REPOSITORY_GET_LS_URI, {
        destination: args.destination,
        adtUri: args.uri,
      })) as { uri?: string }
      const objectUri = lsUriResult?.uri

      if (!objectUri) {
        throw new Error('getLsUri returned no URI')
      }

      const lspResult = await callLspContract(assignTransportToObject, transport, {
        objectUri,
        transport: args.transportId,
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
