/**
 * MCP tool contract for force refresh.
 * MCP layer on top of ADT LSP filesystem service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { forceRefresh } from "../../services/adtLs/fileSystem/forceRefresh.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtForceRefresh = mcpTool({
  name: "adt_force_refresh",
  description: "Force refresh a file",
  types: {
    input: type<{ destination: string; uri: string }>(),
    output: type<{ success: boolean }>(),
  },
});

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: { destination: string; uri: string }) {
      return await callLspContract(forceRefresh, transport, params);
    },
  };
}
