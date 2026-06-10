/**
 * Load statement results contract.
 * LSP method: adtLs/coverage/loadStatementResults
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const loadStatementResults = lspEndpoint({
  method: "adtLs/coverage/loadStatementResults",
  types: {
    params: type<{
      destination: string;
      uri: string;
    }>(),
    response: type<{
      success: boolean;
      statements: Array<{
        line: number;
        covered: boolean;
        executions?: number;
      }>;
    }>(),
  },
});
