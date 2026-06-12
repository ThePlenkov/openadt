import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { assignTransport } from '@openadt/adt-lsp-client'
import { toMcpError, toMcpJson } from '../mcp-result'

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
      return toMcpJson(await assignTransport(transport, args))
    } catch (err) {
      return toMcpError(err)
    }
  },
})
