/**
 * MCP tool contract for simple transport search.
 * MCP layer on top of ADT LSP transport service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { searchTransportsSimple } from "../../services/adtLs/transport/searchTransportsSimple.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtSearchTransportsSimple = mcpTool({
  name: "adt_search_transports_simple",
  description: "Search for ABAP transports (simple)",
  types: {
    input: type<{
      destination: string;
      user?: string;
      status?: "modifiable" | "released" | "all";
    }>(),
    output: type<{
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

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: {
      destination: string;
      user?: string;
      status?: "modifiable" | "released" | "all";
    }) {
      return await callLspContract(searchTransportsSimple, transport, params);
    },
  };
}
