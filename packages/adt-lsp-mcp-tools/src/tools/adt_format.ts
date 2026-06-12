import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { formatDocument } from '@openadt/adt-lsp-client'
import { toMcpError, toMcpJson } from '../mcp-result'

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
      return toMcpJson(await formatDocument(transport, args))
    } catch (err) {
      return toMcpError(err)
    }
  },
})
