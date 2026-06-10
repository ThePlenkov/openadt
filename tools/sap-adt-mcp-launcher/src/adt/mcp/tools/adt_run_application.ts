/**
 * MCP tool contract for running application.
 * MCP layer on top of ADT LSP application run service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { runApplication } from "../../services/adtLs/applicationRun/runApplication.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtRunApplication = mcpTool({
  name: "adt_run_application",
  description: "Run an ABAP application",
  types: {
    input: type<{
      destination: string;
      uri: string;
    }>(),
    output: type<{
      success: boolean;
      output: string;
      exitCode?: number;
    }>(),
  },
});

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: { destination: string; uri: string }) {
      return await callLspContract(runApplication, transport, params);
    },
  };
}
