/**
 * Get folder URI contract.
 * LSP method: adtLs/fileSystem/getFolderUri
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const getFolderUri: LspEndpoint = lspEndpoint({
  method: 'adtLs/fileSystem/getFolderUri',
  types: {
    params: type<{
      destination: string
      uri: string
    }>(),
    response: type<{
      success: boolean
      folderUri: string
    }>(),
  },
})
