/**
 * MCP tool contract for load statement results.
 * MCP layer on top of ADT LSP coverage service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { loadStatementResults } from "../../services/adtLs/coverage/loadStatementResults.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";
import { AgentErrorCode, agentError } from "../../../service/agent/error-codes.js";

export const adt_load_statement_results = mcpTool({
  name: "adt_load_statement_results",
  description: "Load detailed statement coverage results",
  types: {
    input: type<{ destination: string; uri: string }>(),
    output: type<{
      success: boolean;
      statements: Array<{
        line: number;
        covered: boolean;
        executions?: number;
      }>;
    }>(),
  },
});

export const inputSchema = {
  type: "object",
  properties: {
    destination: { type: "string", description: "SAP destination" },
    uri: { type: "string", description: "Object URI" },
  },
  required: ["destination", "uri"],
};

export function createHandler(transport: LspTransport) {
  return {
      async handle(args: Record<string, unknown>) {
        const params = args as any;

        // Validation
        if (typeof params.destination !== "string") {
          return {
            success: false,
            error: agentError(
              AgentErrorCode.INVALID_URI,
              "destination must be a string",
              String(params.destination),
            ),
          };
        }

        if (typeof params.uri !== "string") {
          return {
            success: false,
            error: agentError(
              AgentErrorCode.INVALID_URI,
              "uri must be a string",
              String(params.uri),
            ),
          };
        }


    },
  };
}
