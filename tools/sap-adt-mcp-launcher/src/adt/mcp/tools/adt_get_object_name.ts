/**
 * MCP tool contract for get object name.
 * MCP layer on top of ADT LSP filesystem service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { getObjectName } from "../../services/adtLs/fileSystem/getObjectName.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";
import { AgentErrorCode, agentError } from "../../../service/agent/error-codes.js";

export const adt_get_object_name = mcpTool({
  name: "adt_get_object_name",
  description: "Get object name from URI",
  types: {
    input: type<{ destination: string; uri: string }>(),
    output: type<{ success: boolean; name: string }>(),
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
