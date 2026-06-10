/**
 * Get object name contract.
 * LSP method: adtLs/fileSystem/getObjectName
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const getObjectName = lspEndpoint({
  method: "adtLs/fileSystem/getObjectName",
  types: {
    params: type<{
      destination: string;
      uri: string;
    }>(),
    response: type<{ success: boolean; name: string }>(),
  },
});
