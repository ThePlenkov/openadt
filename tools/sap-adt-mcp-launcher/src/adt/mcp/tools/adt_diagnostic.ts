/**
 * MCP tool contract for diagnostic.
 * MCP layer on top of ADT LSP diagnostic service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { diagnostic } from "../../services/adtLs/diagnostic/diagnostic.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtDiagnostic = mcpTool({
  name: "adt_diagnostic",
  description: "Get syntax and check errors",
  types: {
    input: type<{ destination: string; uri: string }>(),
    output: type<{
      success: boolean;
      diagnostics: Array<{
        severity: "error" | "warning" | "info";
        message: string;
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
    async handle(params: { destination: string; uri: string }) {
      return await callLspContract(diagnostic, transport, params);
    },
  };
}
