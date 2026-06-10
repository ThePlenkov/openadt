/**
 * MCP tool for adt quick search.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod'
import { tool } from '../tool-factory.js'
import { quickSearch } from '../../services/adtLs/repository/quickSearch.js'
import type { LspTransport } from '../../../lsp/client/lsp-transport.js'
import { callLspContract } from '../../../lsp/client/call-lsp-contract.js'
import type { QuickSearchResult } from '../../../config/types.js'

// Zod schema (single source of truth)
const schema = z.object({
  destination: z.string().describe('SAP destination'),
  searchTerm: z.string().describe('Search term'),
})

// Format QuickSearchResult as text
function formatQuickSearchResult(result: QuickSearchResult): string {
  if (result.message) {
    return `Message: ${result.message.label || ''} ${result.message.detail || ''}`
  }

  if (!result.references || result.references.length === 0) {
    return 'No results found.'
  }

  const head = '| Name | Type | Description |\n|------|------|-------------|'
  const rows = result.references.map(
    (r) => `| ${r.name} | ${r.type ?? '?'} | ${r.description ?? ''} |`
  )
  return [head, ...rows].join('\n')
}

// Tool definition for MCP SDK registration
export const adt_quick_search = tool({
  name: 'adt_quick_search',
  description: 'Quick search in the ABAP repository',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const lspResult = await callLspContract(quickSearch, transport, {
        destination: args.destination,
        pattern: args.searchTerm,
      })

      return {
        content: [
          {
            type: 'text',
            text: formatQuickSearchResult(lspResult),
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
