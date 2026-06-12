import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { getHover } from '@openadt/adt-lsp-client'
import { toMcpError, toMcpJson } from '../mcp-result'

const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z
    .string()
    .describe('Object URI (ADT path or repotree URI; tool resolves via getLsUri if needed)'),
  position: z.object({
    line: z.number(),
    character: z.number(),
  }),
  symbol: z.string().optional().describe('Optional symbol name instead of explicit position'),
})

export const adt_get_hover = tool({
  name: 'adt_get_hover',
  description:
    'Get hover documentation. Opens document, primes semantic tokens, then calls textDocument/hover.',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      return toMcpJson(await getHover(transport, args))
    } catch (err) {
      return toMcpError(err)
    }
  },
})
