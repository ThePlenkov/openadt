/**
 * Force refresh contract.
 * LSP method: adtLs/fileSystem/forceRefresh
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const forceRefresh = lspEndpoint({
  method: "adtLs/fileSystem/forceRefresh",
  types: {
    params: type<{
      destination: string;
      uri: string;
    }>(),
    response: type<{ success: boolean }>(),
  },
});
