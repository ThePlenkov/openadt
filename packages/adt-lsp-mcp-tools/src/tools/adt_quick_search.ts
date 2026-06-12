import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { QuickSearchResult } from '@openadt/adt-config'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { quickSearch } from '@openadt/adt-lsp-client'
import { toMcpError, toMcpText } from '../mcp-result'

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

  return JSON.stringify({ references: result.references }, null, 2)
}

export const adt_quick_search = tool({
  name: 'adt_quick_search',
  description:
    'Quick search in the ABAP repository. Returns references[].uri (ADT path) — pass to getLsUri-dependent tools or adt_check_transport_lock.',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const lspResult = await quickSearch(transport, args)
      return toMcpText(
        formatQuickSearchResult(lspResult as QuickSearchResult, args.format || 'markdown')
      )
    } catch (err) {
      return toMcpError(err)
    }
  },
})
