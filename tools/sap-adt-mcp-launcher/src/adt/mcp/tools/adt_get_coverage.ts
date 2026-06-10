/**
 * MCP tool contract for get coverage.
 * MCP layer on top of ADT LSP coverage service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { getCoverage } from "../../services/adtLs/coverage/getCoverage.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtGetCoverage = mcpTool({
  name: "adt_get_coverage",
  description: "Get code coverage data",
  types: {
    input: type<{ destination: string; uri: string }>(),
    output: type<{
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

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: { destination: string; uri: string }) {
      return await callLspContract(getCoverage, transport, params);
    },
  };
}
