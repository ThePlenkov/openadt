/**
 * Find references contract.
 * LSP method: adtLs/references/findReferences
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const findReferences = lspEndpoint({
  method: "adtLs/references/findReferences",
  types: {
    params: type<{
      destination: string;
      uri: string;
      position?: {
        line: number;
        character: number;
      };
    }>(),
    response: type<{
      success: boolean;
      locations: Array<{
        uri: string;
        range: {
          start: { line: number; character: number };
          end: { line: number; character: number };
        };
      }>;
    }>(),
  },
});
