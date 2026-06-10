/**
 * MCP tool contract for creating transport.
 * MCP layer on top of ADT LSP transport service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { createTransportForObjectLock } from "../../services/adtLs/transport/createTransportForObjectLock.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";
import { AgentErrorCode, agentError } from "../../../service/agent/error-codes.js";

export const adt_create_transport = mcpTool({
  name: "adt_create_transport",
  description: "Create a transport for an object",
  types: {
    input: type<{
      destination: string;
      uri: string;
      transportType: "workbench" | "customizing";
      description?: string;
    }>(),
    output: type<{
      success: boolean;
      transportId: string;
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


      uri: string;
      transportType: "workbench" | "customizing";
      description?: string;
    }) {
        try {
          const result = await callLspContract(
        createTransportForObjectLock,
        transport,
        params,
      );
    },
  };
}
