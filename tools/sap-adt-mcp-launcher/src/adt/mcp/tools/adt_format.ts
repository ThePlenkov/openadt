/**
 * MCP tool contract for format.
 * MCP layer on top of ADT LSP format service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { formatting } from "../../services/adtLs/format/formatting.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtFormat = mcpTool({
  name: "adt_format",
  description: "Format ABAP code",
  types: {
    input: type<{
      destination: string;
      uri: string;
      content: string;
    }>(),
    output: type<{
      success: boolean;
      formattedContent: string;
    }>(),
  },
});

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: {
      destination: string;
      uri: string;
      content: string;
    }) {
      return await callLspContract(formatting, transport, params);
    },
  };
}
