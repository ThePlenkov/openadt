/**
 * Transport simple search contract.
 * LSP method: adtLs/transport/searchTransportsSimple
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const searchTransportsSimple = lspEndpoint({
  method: "adtLs/transport/searchTransportsSimple",
  types: {
    params: type<{
      destination: string;
      user?: string;
      status?: "modifiable" | "released" | "all";
    }>(),
    response: type<{
      success: boolean;
      transports: Array<{
        id: string;
        description: string;
        owner: string;
        status: string;
        targetSystem: string;
      }>;
    }>(),
  },
});
