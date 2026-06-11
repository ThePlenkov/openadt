import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { searchTransports } from '@openadt/adt-lsp-client'
import { toMcpError, toMcpJson } from '../mcp-result'

const schema = z.object({
  destination: z
    .string()
    .describe('SAP destination id (SID_CLIENT_USER_LANG, e.g. ABC_200_USER_EN)'),
  number: z.string().optional().describe('Transport number filter (optional)'),
  owner: z.string().optional().describe('Owner filter (optional)'),
  function: z.array(z.string()).optional().describe('Function filter (optional)'),
  status: z.array(z.string()).optional().describe('Status filter (optional)'),
  fromDate: z.string().optional().describe('From date filter (optional)'),
  toDate: z.string().optional().describe('To date filter (optional)'),
  limit: z.number().optional().describe('Limit results (optional)'),
})

export const adt_search_transports = tool({
  name: 'adt_search_transports',
  description:
    'Advanced ABAP transport search (adtLs/cts/transport/searchTransports). Prefer adt_search_transports_simple for listing modifiable transports.',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      return toMcpJson(await searchTransports(transport, args))
    } catch (err) {
      return toMcpError(err)
    }
  },
})
