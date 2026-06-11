import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { createTransport } from '@openadt/adt-lsp-client'
import { toMcpError, toMcpJson } from '../mcp-result'

const schema = z.object({
  destination: z
    .string()
    .describe('SAP destination id (SID_CLIENT_USER_LANG, e.g. ABC_200_USER_EN)'),
  uri: z
    .string()
    .describe(
      'Object URI (ADT path or repotree URI; use getLsUri after adt_quick_search when unsure)'
    ),
  operationType: z
    .enum(['CREATION', 'MODIFICATION'])
    .describe('Operation type: CREATION or MODIFICATION'),
  description: z.string().optional().describe('Optional transport description'),
  ctsProject: z.string().optional().describe('Optional CTS project'),
  changeGuid: z.string().optional().describe('Optional change document GUID'),
})

export const adt_create_transport = tool({
  name: 'adt_create_transport',
  description:
    'Create a transport for an object lock (adtLs/cts/transport/createTransportForObjectLock). Check lock with adt_check_transport_lock first.',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      return toMcpJson(await createTransport(transport, args))
    } catch (err) {
      return toMcpError(err)
    }
  },
})
