import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { forceRefresh } from '@openadt/adt-lsp-client'
import { toMcpError, toMcpJson } from '../mcp-result'

const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z.string().describe('Object URI'),
})

export const adt_force_refresh = tool({
  name: 'adt_force_refresh',
  description: 'Force refresh of object from server',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      return toMcpJson(await forceRefresh(transport, args))
    } catch (err) {
      return toMcpError(err)
    }
  },
})
