import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { getLsUri } from '@openadt/adt-lsp-client'
import { toMcpError, toMcpJson } from '../mcp-result'

const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z.string().describe('ADT object path (e.g. /sap/bc/adt/oo/classes/cl_x)'),
})

export const adt_get_ls_uri = tool({
  name: 'adt_get_ls_uri',
  description:
    'Convert ADT path to repotree URI for file operations. Use after adt_quick_search to get the proper URI for document symbols, format, hover, etc.',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      return toMcpJson(await getLsUri(transport, args))
    } catch (err) {
      return toMcpError(err)
    }
  },
})
