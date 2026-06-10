/**
 * Check transport lock contract.
 * LSP method: adtLs/transport/checkTransportForObjectLock
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const checkTransportForObjectLock = lspEndpoint({
  method: "adtLs/transport/checkTransportForObjectLock",
  types: {
    params: type<{
      destination: string;
      uri: string;
    }>(),
    response: type<{
      requiresTransport: boolean;
      transportId?: string;
    }>(),
  },
});
