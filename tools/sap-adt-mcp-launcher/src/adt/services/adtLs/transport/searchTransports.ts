/**
 * Transport advanced search contract.
 * LSP method: adtLs/transport/searchTransports
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const searchTransports = lspEndpoint({
  method: "adtLs/transport/searchTransports",
  types: {
    params: type<{
      destination: string;
      user?: string;
      status?: "modifiable" | "released" | "all";
      targetSystem?: string;
      transportType?: string;
    }>(),
    response: type<{
      success: boolean;
      transports: Array<{
        id: string;
        description: string;
        owner: string;
        status: string;
        targetSystem: string;
        type: string;
      }>;
    }>(),
  },
});
