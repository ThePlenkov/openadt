/**
 * MCP tool contract for advanced transport search.
 * MCP layer on top of ADT LSP transport service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { searchTransports } from "../../services/adtLs/transport/searchTransports.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtSearchTransports = mcpTool({
  name: "adt_search_transports",
  description: "Search for ABAP transports (advanced)",
  types: {
    input: type<{
      destination: string;
      user?: string;
      status?: "modifiable" | "released" | "all";
      targetSystem?: string;
      transportType?: string;
    }>(),
    output: type<{
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

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: {
      destination: string;
      user?: string;
      status?: "modifiable" | "released" | "all";
      targetSystem?: string;
      transportType?: string;
    }) {
      return await callLspContract(searchTransports, transport, params);
    },
  };
}
