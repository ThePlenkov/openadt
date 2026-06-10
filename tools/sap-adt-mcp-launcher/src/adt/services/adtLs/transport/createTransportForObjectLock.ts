/**
 * Create transport contract.
 * LSP method: adtLs/transport/createTransportForObjectLock
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const createTransportForObjectLock = lspEndpoint({
  method: "adtLs/transport/createTransportForObjectLock",
  types: {
    params: type<{
      destination: string;
      uri: string;
      transportType: "workbench" | "customizing";
      description?: string;
    }>(),
    response: type<{
      success: boolean;
      transportId: string;
    }>(),
  },
});
