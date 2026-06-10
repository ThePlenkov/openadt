/**
 * Assign transport contract.
 * LSP method: adtLs/transport/assignTransportToObject
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const assignTransportToObject = lspEndpoint({
  method: "adtLs/transport/assignTransportToObject",
  types: {
    params: type<{
      destination: string;
      uri: string;
      transportId: string;
    }>(),
    response: type<{ success: boolean }>(),
  },
});
