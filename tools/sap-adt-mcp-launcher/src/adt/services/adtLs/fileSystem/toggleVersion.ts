/**
 * Toggle version contract.
 * LSP method: adtLs/fileSystem/toggleVersion
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const toggleVersion = lspEndpoint({
  method: "adtLs/fileSystem/toggleVersion",
  types: {
    params: type<{
      destination: string;
      uri: string;
    }>(),
    response: type<{
      success: boolean;
      isActive: boolean;
    }>(),
  },
});
