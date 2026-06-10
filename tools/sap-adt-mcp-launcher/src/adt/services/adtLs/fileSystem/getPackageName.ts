/**
 * Get package name contract.
 * LSP method: adtLs/fileSystem/getPackageName
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const getPackageName = lspEndpoint({
  method: "adtLs/fileSystem/getPackageName",
  types: {
    params: type<{
      destination: string;
      uri: string;
    }>(),
    response: type<{ success: boolean; package: string }>(),
  },
});
