import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { getFileLockStatus } from '@openadt/adt-lsp-client'
import { toMcpError, toMcpJson } from '../mcp-result'

const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z.string().describe('Object URI'),
})

export const adt_get_file_lock_status = tool({
  name: 'adt_get_file_lock_status',
  description: 'Get lock status of an ABAP object',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      return toMcpJson(await getFileLockStatus(transport, args))
    } catch (err) {
      return toMcpError(err)
    }
  },
})
