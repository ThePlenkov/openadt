/**
 * MCP tool for adt quick search.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import { quickSearch } from '@openadt/adt-services'
import type { LspTransport } from '@openadt/lsp-client'
import { callLspContract } from '@openadt/lsp-client'
import type { QuickSearchResult } from '@openadt/adt-config'

// Zod schema (single source of truth)
const schema = z.object({
  destination: z
    .string()
    .describe('SAP destination id (SID_CLIENT_USER_LANG, e.g. ABC_200_USER_EN)'),
  searchTerm: z.string().describe('Search pattern (LSP field: pattern)'),
  types: z.array(z.string()).optional().describe('Object type filters (e.g., ["CLAS", "PROG"])'),
  maxResults: z.number().optional().describe('Maximum number of results to return'),
  format: z
    .enum(['json', 'markdown', 'compact'])
    .optional()
    .describe('Output format: markdown table (default), json, or compact text'),
})

// Format QuickSearchResult as text
function formatQuickSearchResult(
  result: QuickSearchResult,
  format: 'json' | 'markdown' | 'compact' = 'markdown'
): string {
  if (result.message) {
    return `Message: ${result.message.label || ''} ${result.message.detail || ''}`
  }

  if (!result.references || result.references.length === 0) {
    return 'No results found.'
  }

  if (format === 'markdown') {
    const head = '| Name | Type | Description |\n|------|------|-------------|'
    const rows = result.references.map(
      (r) => `| ${r.name} | ${r.type ?? '?'} | ${r.description ?? ''} |`
    )
    return [head, ...rows].join('\n')
  }

  if (format === 'compact') {
    return result.references
      .map((r) => {
        const desc = r.description ? ` — ${r.description}` : ''
        return `${r.name}${desc} (${r.type ?? '?'})`
      })
      .join('\n')
  }

  // Default to JSON
  return JSON.stringify({ references: result.references }, null, 2)
}

// Tool definition for MCP SDK registration
export const adt_quick_search = tool({
  name: 'adt_quick_search',
  description:
    'Quick search in the ABAP repository. Returns references[].uri (ADT path) — pass to getLsUri-dependent tools or adt_check_transport_lock.',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const lspResult = await callLspContract(quickSearch, transport, {
        destination: args.destination,
        pattern: args.searchTerm,
        types: args.types,
        maxResults: args.maxResults,
      })

      return {
        content: [
          {
            type: 'text',
            text: formatQuickSearchResult(
              lspResult as QuickSearchResult,
              args.format || 'markdown'
            ),
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
