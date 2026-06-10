/**
 * MCP tool contract for load statement results.
 * MCP layer on top of ADT LSP coverage service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { loadStatementResults } from "../../services/adtLs/coverage/loadStatementResults.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtLoadStatementResults = mcpTool({
  name: "adt_load_statement_results",
  description: "Load detailed statement coverage results",
  types: {
    input: type<{ destination: string; uri: string }>(),
    output: type<{
      success: boolean;
      statements: Array<{
        line: number;
        covered: boolean;
        executions?: number;
      }>;
    }>(),
  },
});

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: { destination: string; uri: string }) {
      return await callLspContract(loadStatementResults, transport, params);
    },
  };
}
