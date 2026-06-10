/**
 * Get coverage contract.
 * LSP method: adtLs/coverage/getCoverage
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const getCoverage = lspEndpoint({
  method: "adtLs/coverage/getCoverage",
  types: {
    params: type<{
      destination: string;
      uri: string;
    }>(),
    response: type<{
      success: boolean;
      coverage: {
        percentage: number;
        coveredLines: number;
        totalLines: number;
        branches?: Array<{ line: number; covered: boolean }>;
      };
    }>(),
  },
});
