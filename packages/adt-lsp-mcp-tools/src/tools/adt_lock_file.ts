import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { lockFile } from '@openadt/adt-lsp-client'
import { toMcpError, toMcpJson } from '../mcp-result'

const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z.string().describe('Object URI'),
})

export const adt_lock_file = tool({
  name: 'adt_lock_file',
  description: 'Lock an ABAP object for editing',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      return toMcpJson(await lockFile(transport, args))
    } catch (err) {
      return toMcpError(err)
    }
  },
})
