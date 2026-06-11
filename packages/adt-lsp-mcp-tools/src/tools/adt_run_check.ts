import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { runAtcCheck } from '@openadt/adt-lsp-client'
import { toMcpError, toMcpJson } from '../mcp-result'

const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z.string().describe('Object URI (ADT path or repotree URI)'),
  checkVariant: z.string().optional().describe('ATC check variant name (empty = system default)'),
  uris: z.array(z.string()).optional().describe('Deprecated — use uri'),
  variant: z.string().optional().describe('Deprecated — use checkVariant'),
})

export const adt_run_check = tool({
  name: 'adt_run_check',
  description: 'Run ATC check on an object (adtLs/atc/runCheck).',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const uri = args.uri ?? args.uris?.[0]
      if (!uri) {
        throw new Error('Provide uri.')
      }
      return toMcpJson(
        await runAtcCheck(transport, {
          destination: args.destination,
          uri,
          checkVariant: args.checkVariant ?? args.variant,
        })
      )
    } catch (err) {
      return toMcpError(err)
    }
  },
})
