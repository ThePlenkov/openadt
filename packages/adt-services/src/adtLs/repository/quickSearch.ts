/**
 * Repository quick search contract.
 * LSP method: adtLs/repository/quickSearch
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'
import type { QuickSearchResult } from '@openadt/adt-config'

export const quickSearch: LspEndpoint = lspEndpoint({
  method: 'adtLs/repository/quickSearch',
  types: {
    params: type<{
      destination: string
      pattern: string
      types?: string[]
      maxResults?: number
    }>(),
    response: type<QuickSearchResult>(),
  },
})
