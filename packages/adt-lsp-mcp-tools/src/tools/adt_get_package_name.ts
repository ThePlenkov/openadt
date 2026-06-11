import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { getPackageName } from '@openadt/adt-lsp-client'
import { toMcpError, toMcpJson } from '../mcp-result'

const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z.string().describe('Object URI (ADT path or repotree URI)'),
})

export const adt_get_package_name = tool({
  name: 'adt_get_package_name',
  description: 'Get package name from object URI',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      return toMcpJson(await getPackageName(transport, args))
    } catch (err) {
      return toMcpError(err)
    }
  },
})
