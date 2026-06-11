import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { runAbapApplication } from '@openadt/adt-lsp-client'
import { toMcpError, toMcpJson } from '../mcp-result'

const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z
    .string()
    .describe('Object URI (ADT path or repotree URI; tool resolves via getLsUri if needed)'),
})

export const adt_run_application = tool({
  name: 'adt_run_application',
  description:
    'Run an ABAP application console. Resolves repotree URI then calls adtLs/run/runApplication.',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      return toMcpJson(await runAbapApplication(transport, args))
    } catch (err) {
      return toMcpError(err)
    }
  },
})
