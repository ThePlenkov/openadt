/**
 * MCP tool for running ATC check.
 */
import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import { runCheck as atcRunCheck } from '@openadt/adt-services'
import type { LspTransport } from '@openadt/lsp-client'
import { callLspContract, resolveRepotreeUri } from '@openadt/lsp-client'

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
      const adtUri = args.uri ?? args.uris?.[0]
      const checkVariant = args.checkVariant ?? args.variant ?? ''
      if (!adtUri) {
        throw new Error('Provide uri.')
      }

      const objectUri = await resolveRepotreeUri(transport, {
        destination: args.destination,
        uri: adtUri,
      })

      const lspResult = await callLspContract(atcRunCheck, transport, {
        objectUri,
        checkVariant,
      })

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
