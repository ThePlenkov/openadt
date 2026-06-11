/**
 * MCP tool for adt format.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod'
import { LSP_METHOD_REPOSITORY_GET_LS_URI } from '@openadt/adt-config'
import { tool } from '@openadt/mcp-tools'
import { formatting } from '@openadt/adt-services'
import type { LspTransport } from '@openadt/lsp-client'
import { callLspContract } from '@openadt/lsp-client'

// Zod schema (single source of truth)
const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z
    .string()
    .describe('Object URI (ADT path or repotree URI; tool resolves via getLsUri if needed)'),
  content: z.string().describe('ABAP code to format'),
})

// Tool definition for MCP SDK registration
export const adt_format = tool({
  name: 'adt_format',
  description: 'Format ABAP code. Accepts ADT path and resolves repotree URI internally.',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      // Convert ADT path to repotree URI if needed
      const lsUriResult = (await transport.sendRequest(LSP_METHOD_REPOSITORY_GET_LS_URI, {
        destination: args.destination,
        adtUri: args.uri,
      })) as { uri?: string }
      const objectUri = lsUriResult?.uri || args.uri

      const lspResult = await callLspContract(formatting, transport, {
        destination: args.destination,
        uri: objectUri,
        content: args.content,
      } as unknown as Parameters<typeof formatting>[1])

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
