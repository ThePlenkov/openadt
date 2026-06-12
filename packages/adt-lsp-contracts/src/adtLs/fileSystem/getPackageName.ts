/**
 * Get package name contract.
 * LSP method: adtLs/fileSystem/getPackageName
 */
import { lspEndpoint, type, type LspEndpoint } from '../../lsp/contract-core'

export const getPackageName: LspEndpoint = lspEndpoint({
  method: 'adtLs/fileSystem/getPackageName',
  types: {
    params: type<{
      destination: string
      uri: string
    }>(),
    response: type<{ success: boolean; package: string }>(),
  },
})
