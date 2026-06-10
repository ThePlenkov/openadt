/**
 * MCP tool contract for assigning transport.
 * MCP layer on top of ADT LSP transport service.
 */
import { mcpTool, type, Infer } from "../../../mcp/contract/contract-core.js";
import { assignTransportToObject } from "../../services/adtLs/transport/assignTransportToObject.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";
import { AgentErrorCode, agentError } from "../../../service/agent/error-codes.js";

export const adt_assign_transport = mcpTool({
  name: "adt_assign_transport",
  description: "Assign a transport to an object",
  types: {
    input: type<{
      destination: string;
      uri: string;
      transportId: string;
    }>(),
    output: type<{ success: boolean }>(),
  },
});

export const inputSchema = {
  type: "object",
  properties: {
    destination: { type: "string", description: "SAP destination" },
    uri: { type: "string", description: "Object URI" },
  },
  required: ["destination", "uri"],
} as const;

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


      uri: string;
      transportId: string;
    }) {
        try {
          const result = await callLspContract(
    },
  };
}
