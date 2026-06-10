/**
 * Get inactive objects contract.
 * LSP method: adtLs/activation/getInactiveObjects
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const getInactiveObjects = lspEndpoint({
  method: "adtLs/activation/getInactiveObjects",
  types: {
    params: type<{
      destination: string;
      package?: string;
      objectType?: string;
    }>(),
    response: type<{
      success: boolean;
      objects: Array<{
        name: string;
        type: string;
        uri: string;
        package?: string;
      }>;
    }>(),
  },
});
