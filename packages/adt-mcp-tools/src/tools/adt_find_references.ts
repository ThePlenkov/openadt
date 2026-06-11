/**
 * MCP tool for adt find references.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import { references } from '@openadt/adt-services'
import type { LspTransport } from '@openadt/lsp-client'
import {
  callLspContract,
  enrichFindReferencesError,
  resolveLspPosition,
  withOpenDocument,
} from '@openadt/lsp-client'

const FIND_REFERENCES_TIMEOUT_MS = 20_000

const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z
    .string()
    .describe('Object URI (ADT path or repotree URI; tool resolves via getLsUri if needed)'),
  position: z
    .object({
      line: z.number(),
      character: z.number(),
    })
    .optional()
    .describe('0-based LSP position (use symbol instead when possible)'),
  symbol: z
    .string()
    .optional()
    .describe('Symbol name to locate in outline/source (preferred for find-references)'),
})

export const adt_find_references = tool({
  name: 'adt_find_references',
  description:
    'Find usages of a symbol. Opens document (getLsUri → readFile → didOpen), resolves position, calls textDocument/references, then didClose. Timeout 20s.',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      if (!args.position && !args.symbol) {
        throw new Error('Provide position (0-based) or symbol name.')
      }

      const lspResult = await withOpenDocument(
        transport,
        { destination: args.destination, uri: args.uri },
        async (ctx) => {
          const position = await resolveLspPosition(transport, ctx, {
            position: args.position,
            symbol: args.symbol,
          })

          return callLspContract(
            references,
            transport,
            {
              textDocument: { uri: ctx.repotreeUri },
              position,
              context: { includeDeclaration: false },
            },
            { timeoutMs: FIND_REFERENCES_TIMEOUT_MS }
          )
        }
      )

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(lspResult, null, 2),
          },
        ],
      }
    } catch (err) {
      const message = enrichFindReferencesError(err, FIND_REFERENCES_TIMEOUT_MS).message
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
