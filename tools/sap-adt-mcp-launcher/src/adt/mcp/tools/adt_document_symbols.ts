/**
 * MCP tool contract for document symbols.
 * MCP layer on top of ADT LSP document symbol service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { documentSymbols } from "../../services/adtLs/documentSymbol/documentSymbols.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtDocumentSymbols = mcpTool({
  name: "adt_document_symbols",
  description: "Get document symbols (outline) for a file",
  types: {
    input: type<{
      destination: string;
      uri: string;
    }>(),
    output: type<{
      success: boolean;
      symbols: Array<{
        name: string;
        kind: string;
        detail?: string;
        range: {
          start: { line: number; character: number };
          end: { line: number; character: number };
        };
        children?: unknown[];
      }>;
    }>(),
  },
});

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: { destination: string; uri: string }) {
      return await callLspContract(documentSymbols, transport, params);
    },
  };
}
