/**
 * MCP tool for adt diagnostic.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import { diagnostic } from '@openadt/adt-services'
import type { LspTransport } from '@openadt/lsp-client'
import { callLspContract, withOpenDocument } from '@openadt/lsp-client'

const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z
    .string()
    .describe('Object URI (ADT path or repotree URI; tool resolves via getLsUri if needed)'),
})

export const adt_diagnostic = tool({
  name: 'adt_diagnostic',
  description: 'Get syntax check diagnostics. Opens document then calls textDocument/diagnostic.',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const lspResult = await withOpenDocument(
        transport,
        { destination: args.destination, uri: args.uri },
        async (ctx) =>
          callLspContract(diagnostic, transport, {
            textDocument: { uri: ctx.repotreeUri },
          })
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
