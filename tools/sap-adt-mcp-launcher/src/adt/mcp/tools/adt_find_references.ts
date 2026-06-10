/**
 * MCP tool contract for finding references.
 * MCP layer on top of ADT LSP references service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { findReferences } from "../../services/adtLs/references/findReferences.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtFindReferences = mcpTool({
  name: "adt_find_references",
  description: "Find usages of an object",
  types: {
    input: type<{
      destination: string;
      uri: string;
      position?: {
        line: number;
        character: number;
      };
    }>(),
    output: type<{
      success: boolean;
      locations: Array<{
        uri: string;
        range: {
          start: { line: number; character: number };
          end: { line: number; character: number };
        };
      }>;
    }>(),
  },
});

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: {
      destination: string;
      uri: string;
      position?: { line: number; character: number };
    }) {
      return await callLspContract(findReferences, transport, params);
    },
  };
}
