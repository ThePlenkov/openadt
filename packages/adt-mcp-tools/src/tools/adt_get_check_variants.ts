/**
 * MCP tool for adt get check variants.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import { getCheckVariants } from '@openadt/adt-services'
import type { LspTransport } from '@openadt/lsp-client'
import { callLspContract } from '@openadt/lsp-client'

// Zod schema (single source of truth)
const schema = z.object({
  destination: z.string().describe('SAP destination'),
})

// Tool definition for MCP SDK registration
export const adt_get_check_variants = tool({
  name: 'adt_get_check_variants',
  description: 'Get ATC check variants',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const lspResult = await callLspContract(getCheckVariants, transport, {
        destination: args.destination,
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
