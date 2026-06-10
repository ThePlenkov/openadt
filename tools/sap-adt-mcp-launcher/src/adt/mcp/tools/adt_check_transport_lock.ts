/**
 * MCP tool contract for checking transport lock.
 * MCP layer on top of ADT LSP transport service.
 */
import { mcpTool, type, Infer } from "../../../mcp/contract/contract-core.js";
import { checkTransportForObjectLock } from "../../services/adtLs/transport/checkTransportForObjectLock.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";
import { AgentErrorCode, agentError } from "../../../service/agent/error-codes.js";

export const adt_check_transport_lock = mcpTool({
  name: "adt_check_transport_lock",
  description: "Check if an object requires a transport",
  types: {
    input: type<{
      destination: string;
      uri: string;
    }>(),
    output: type<{
      requiresTransport: boolean;
      transportId?: string;
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


        checkTransportForObjectLock,
        transport,
        params,
      );
    },
  };
}
