import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { checkTransportLock } from '@openadt/adt-lsp-client'
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
  transportId: z
    .string()
    .optional()
    .describe('Optional; not used for lock check (LSP uses objectInfo + operationType)'),
})

export const adt_check_transport_lock = tool({
  name: 'adt_check_transport_lock',
  description:
    'Check if an ABAP object requires transport recording. This tool calls getLsUri internally to resolve the repotree URI; do NOT call adt_get_ls_uri first. Pass ADT path from adt_quick_search as uri. For workflow guidance, call MCP prompt "adt_lsp_workflow".',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      return toMcpJson(await checkTransportLock(transport, args))
    } catch (err) {
      return toMcpError(err)
    }
  },
})
