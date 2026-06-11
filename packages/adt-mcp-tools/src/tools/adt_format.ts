/**
 * MCP tool for adt format.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import { formatting } from '@openadt/adt-services'
import type { LspTransport } from '@openadt/lsp-client'
import { applyTextEdits, callLspContract, withOpenDocument } from '@openadt/lsp-client'

const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z
    .string()
    .describe('Object URI (ADT path or repotree URI; tool resolves via getLsUri if needed)'),
  content: z
    .string()
    .optional()
    .describe('Optional source override for didOpen (default: read from backend)'),
  tabSize: z.number().optional().describe('Pretty-printer tab size (default 2)'),
  insertSpaces: z.boolean().optional().describe('Use spaces instead of tabs (default true)'),
})

export const adt_format = tool({
  name: 'adt_format',
  description:
    'Format ABAP source via textDocument/formatting (pretty-printer registered on didOpen).',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const result = await withOpenDocument(
        transport,
        {
          destination: args.destination,
          uri: args.uri,
          textOverride: args.content,
        },
        async (ctx) => {
          const edits = await callLspContract(formatting, transport, {
            textDocument: { uri: ctx.repotreeUri },
            options: {
              tabSize: args.tabSize ?? 2,
              insertSpaces: args.insertSpaces ?? true,
            },
          })
          const list = Array.isArray(edits) ? edits : []
          return {
            edits: list,
            formatted: applyTextEdits(ctx.content, list),
          }
        }
      )

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
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
