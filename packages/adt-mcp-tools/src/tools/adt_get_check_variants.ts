/**
 * MCP tool for adt get check variants.
 */
import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import { getCheckVariants } from '@openadt/adt-services'
import type { LspTransport } from '@openadt/lsp-client'
import { callLspContract, resolveRepotreeUri } from '@openadt/lsp-client'

const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z
    .string()
    .describe('Object URI (ADT path or repotree URI; tool resolves via getLsUri if needed)'),
  quickPickUserInput: z
    .string()
    .optional()
    .describe('ATC variant filter (use * for all; empty is rejected by SAP backend)'),
})

export const adt_get_check_variants = tool({
  name: 'adt_get_check_variants',
  description: 'Get ATC check variants for an object (adtLs/atc/getCheckVariants).',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const objectUri = await resolveRepotreeUri(transport, {
        destination: args.destination,
        uri: args.uri,
      })

      const lspResult = await callLspContract(getCheckVariants, transport, {
        objectUri,
        quickPickUserInput: args.quickPickUserInput ?? '*',
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
