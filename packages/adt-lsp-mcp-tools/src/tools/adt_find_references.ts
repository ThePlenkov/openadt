import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { findReferences } from '@openadt/adt-lsp-client'
import { toMcpError, toMcpJson } from '../mcp-result'

const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z
    .string()
    .describe('Object URI (ADT path or repotree URI; tool resolves via getLsUri if needed)'),
  position: z
    .object({
      line: z.number(),
      character: z.number(),
    })
    .optional()
    .describe('0-based LSP position (use symbol instead when possible)'),
  symbol: z
    .string()
    .optional()
    .describe('Symbol name to locate in outline/source (preferred for find-references)'),
})

export const adt_find_references = tool({
  name: 'adt_find_references',
  description:
    'Find usages of a symbol. Opens document (getLsUri → readFile → didOpen), resolves position, calls textDocument/references, then didClose. Timeout 20s.',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      return toMcpJson(await findReferences(transport, args))
    } catch (err) {
      return toMcpError(err)
    }
  },
})
