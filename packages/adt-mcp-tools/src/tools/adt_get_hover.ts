/**
 * MCP tool for adt get hover.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import { hover } from '@openadt/adt-services'
import type { LspTransport } from '@openadt/lsp-client'
import {
  callLspContract,
  primeSemanticTokens,
  resolveLspPosition,
  withOpenDocument,
} from '@openadt/lsp-client'

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
      const lspResult = await withOpenDocument(
        transport,
        { destination: args.destination, uri: args.uri },
        async (ctx) => {
          await primeSemanticTokens(transport, ctx.repotreeUri)
          const position = await resolveLspPosition(transport, ctx, {
            position: args.position,
            symbol: args.symbol,
          })
          return callLspContract(hover, transport, {
            textDocument: { uri: ctx.repotreeUri },
            position,
          })
        }
      )

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(lspResult, null, 2),
          },
        ],
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${message}`,
          },
        ],
        isError: true,
      }
    }
  },
})
