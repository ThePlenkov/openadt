import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { getDocumentSymbols } from '@openadt/adt-lsp-client'
import { toMcpError, toMcpJson } from '../mcp-result'

const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z
    .string()
    .describe('Object URI (ADT path or repotree URI; tool resolves via getLsUri if needed)'),
})

export const adt_document_symbols = tool({
  name: 'adt_document_symbols',
  description:
    'Get document symbols (outline) for a file. Opens document then calls textDocument/documentSymbol.',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      return toMcpJson(await getDocumentSymbols(transport, args))
    } catch (err) {
      return toMcpError(err)
    }
  },
})
