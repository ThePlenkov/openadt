/**
 * MCP tool for adt run application.
 */
import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import { runApplication } from '@openadt/adt-services'
import type { LspTransport } from '@openadt/lsp-client'
import { callLspContract, prewarmRepotreeObject } from '@openadt/lsp-client'

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
      const { repotreeUri } = await prewarmRepotreeObject(transport, {
        destination: args.destination,
        uri: args.uri,
      })

      const lspResult = await callLspContract(runApplication, transport, repotreeUri, {
        paramStructure: 'byPosition',
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
