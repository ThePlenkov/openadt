/**
 * MCP tool contract for get hover.
 * MCP layer on top of ADT LSP hover service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { getHover } from "../../services/adtLs/hover/getHover.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtGetHover = mcpTool({
  name: "adt_get_hover",
  description: "Get hover documentation",
  types: {
    input: type<{
      destination: string;
      uri: string;
      position: {
        line: number;
        character: number;
      };
    }>(),
    output: type<{
      success: boolean;
      documentation: string;
    }>(),
  },
});

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: {
      destination: string;
      uri: string;
      position: { line: number; character: number };
    }) {
      return await callLspContract(getHover, transport, params);
    },
  };
}
