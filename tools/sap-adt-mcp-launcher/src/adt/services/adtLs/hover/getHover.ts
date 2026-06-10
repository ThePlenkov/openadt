/**
 * Get hover contract.
 * LSP method: adtLs/hover/getHover
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const getHover = lspEndpoint({
  method: "adtLs/hover/getHover",
  types: {
    params: type<{
      destination: string;
      uri: string;
      position: {
        line: number;
        character: number;
      };
    }>(),
    response: type<{
      success: boolean;
      documentation: string;
    }>(),
  },
});
