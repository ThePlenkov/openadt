import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { searchTransportsSimple } from '@openadt/adt-lsp-client'
import { toMcpError, toMcpJson } from '../mcp-result'

const schema = z.object({
  destination: z
    .string()
    .describe('SAP destination id (SID_CLIENT_USER_LANG, e.g. ABC_200_USER_EN)'),
  owner: z.string().describe('Transport owner'),
  function: z.string().describe('Transport function'),
})

export const adt_search_transports_simple = tool({
  name: 'adt_search_transports_simple',
  description:
    'Simple ABAP transport search (adtLs/cts/transport/searchTransportsSimple). Use to find modifiable transports.',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      return toMcpJson(await searchTransportsSimple(transport, args))
    } catch (err) {
      return toMcpError(err)
    }
  },
})
