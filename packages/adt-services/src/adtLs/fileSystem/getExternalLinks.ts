/**
 * Get external links contract.
 * LSP method: adtLs/fileSystem/getExternalLinks
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const getExternalLinks: LspEndpoint = lspEndpoint({
  method: 'adtLs/fileSystem/getExternalLinks',
  types: {
    params: type<{
      destination: string
      uri: string
    }>(),
    response: type<{
      success: boolean
      links: Array<{ name: string; url: string }>
    }>(),
  },
})
