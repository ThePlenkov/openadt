/**
 * MCP tool contract for run check.
 * MCP layer on top of ADT LSP ATC service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { runCheck as atcRunCheck } from "../../services/adtLs/atc/runCheck.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtRunCheck = mcpTool({
  name: "adt_run_check",
  description: "Run ATC check",
  types: {
    input: type<{
      destination: string;
      uris: string[];
      variant?: string;
    }>(),
    output: type<{
      success: boolean;
      findings: unknown[];
    }>(),
  },
});

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: {
      destination: string;
      uris: string[];
      variant?: string;
    }) {
      return await callLspContract(atcRunCheck, transport, params);
    },
  };
}
