/**
 * Get folder URI contract.
 * LSP method: adtLs/fileSystem/getFolderUri
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const getFolderUri = lspEndpoint({
  method: "adtLs/fileSystem/getFolderUri",
  types: {
    params: type<{
      destination: string;
      uri: string;
    }>(),
    response: type<{
      success: boolean;
      folderUri: string;
    }>(),
  },
});
