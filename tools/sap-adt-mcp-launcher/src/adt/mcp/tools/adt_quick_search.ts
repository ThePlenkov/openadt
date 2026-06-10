/**
 * MCP tool contract for repository quick search.
 * MCP layer on top of ADT LSP repository service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { quickSearch } from "../../services/adtLs/repository/quickSearch.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtQuickSearch = mcpTool({
  name: "adt_quick_search",
  description: "Search ABAP repository for objects matching a pattern",
  types: {
    input: type<{
      destination: string;
      pattern: string;
      types?: string[];
      maxResults?: number;
    }>(),
    output: type<{
      success: boolean;
      references?: Array<{
        name: string;
        type: string;
        uri: string;
      }>;
    }>(),
  },
});

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: {
      destination: string;
      pattern: string;
      types?: string[];
      maxResults?: number;
    }) {
      return await callLspContract(quickSearch, transport, params);
    },
  };
}
