/**
 * MCP tool for running ATC check.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import { runCheck as atcRunCheck } from '@openadt/adt-services'
import type { LspTransport } from '@openadt/lsp-client'
import { callLspContract } from '@openadt/lsp-client'

// Zod schema (single source of truth)
const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uris: z.array(z.string()).describe('Object URIs'),
  variant: z.string().optional().describe('Check variant (optional)'),
})

// Tool definition for MCP SDK registration
export const adt_run_check = tool({
  name: 'adt_run_check',
  description: 'Run ATC check',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const lspResult = await callLspContract(atcRunCheck, transport, {
        destination: args.destination,
        uris: args.uris,
        variant: args.variant,
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
