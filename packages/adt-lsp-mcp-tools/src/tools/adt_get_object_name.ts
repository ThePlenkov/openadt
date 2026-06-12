import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { getObjectName } from '@openadt/adt-lsp-client'
import { toMcpError, toMcpJson } from '../mcp-result'

const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z.string().describe('Object URI'),
})

export const adt_get_object_name = tool({
  name: 'adt_get_object_name',
  description: 'Get object name from URI',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      return toMcpJson(await getObjectName(transport, args))
    } catch (err) {
      return toMcpError(err)
    }
  },
})
