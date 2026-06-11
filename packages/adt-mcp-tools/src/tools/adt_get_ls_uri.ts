/**
 * MCP tool for adt get LSP URI.
 * Converts ADT path to repotree URI for file operations.
 */
import { z } from 'zod'
import { LSP_METHOD_REPOSITORY_GET_LS_URI } from '@openadt/adt-config'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/lsp-client'

// Zod schema (single source of truth)
const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z.string().describe('ADT object path (e.g. /sap/bc/adt/oo/classes/cl_x)'),
})

// Tool definition for MCP SDK registration
export const adt_get_ls_uri = tool({
  name: 'adt_get_ls_uri',
  description:
    'Convert ADT path to repotree URI for file operations. Use after adt_quick_search to get the proper URI for document symbols, format, hover, etc.',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const lsUriResult = (await transport.sendRequest(LSP_METHOD_REPOSITORY_GET_LS_URI, {
        destination: args.destination,
        adtUri: args.uri,
      })) as { uri?: string }

      if (!lsUriResult?.uri) {
        throw new Error(`getLsUri did not resolve ${args.uri}`)
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(lsUriResult, null, 2),
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
