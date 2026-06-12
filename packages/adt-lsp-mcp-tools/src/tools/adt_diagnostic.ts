import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { getDiagnostics } from '@openadt/adt-lsp-client'
import { toMcpError, toMcpJson } from '../mcp-result'

const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z
    .string()
    .describe('Object URI (ADT path or repotree URI; tool resolves via getLsUri if needed)'),
})

export const adt_diagnostic = tool({
  name: 'adt_diagnostic',
  description: 'Get syntax and check diagnostics via textDocument/diagnostic.',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      return toMcpJson(await getDiagnostics(transport, args))
    } catch (err) {
      return toMcpError(err)
    }
  },
})
