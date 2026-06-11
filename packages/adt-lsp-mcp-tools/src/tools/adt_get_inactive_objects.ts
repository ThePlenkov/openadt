import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { getInactiveObjects } from '@openadt/adt-lsp-client'
import { toMcpError, toMcpJson } from '../mcp-result'

const schema = z.object({
  destination: z.string().describe('SAP destination'),
  package: z.string().optional().describe('Package filter (optional)'),
  objectType: z.string().optional().describe('Object type filter (optional)'),
})

export const adt_get_inactive_objects = tool({
  name: 'adt_get_inactive_objects',
  description: 'Get list of inactive objects in the current request',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      return toMcpJson(await getInactiveObjects(transport, args))
    } catch (err) {
      return toMcpError(err)
    }
  },
})
