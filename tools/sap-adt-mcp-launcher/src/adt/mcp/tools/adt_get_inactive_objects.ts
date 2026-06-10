/**
 * MCP tool contract for getting inactive objects.
 * MCP layer on top of ADT LSP activation service.
 */
import { mcpTool, type, Infer } from "../../../mcp/contract/contract-core.js";
import { getInactiveObjects } from "../../services/adtLs/activation/getInactiveObjects.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";
import {
  AgentErrorCode,
  agentError,
} from "../../../service/agent/error-codes.js";

export const adt_get_inactive_objects = mcpTool({
  name: "adt_get_inactive_objects",
  description: "Get list of inactive objects in the current request",
  types: {
    input: type<{
      destination: string;
      package?: string;
      objectType?: string;
    }>(),
    output: type<{
      success: boolean;
      objects: Array<{
        name: string;
        type: string;
        uri: string;
        package?: string;
      }>;
    }>(),
  },
});

export const inputSchema = {
  type: "object",
  properties: {
    destination: { type: "string", description: "SAP destination" },
    package: { type: "string", description: "Package filter (optional)" },
    objectType: {
      type: "string",
      description: "Object type filter (optional)",
    },
  },
  required: ["destination"],
} as const;

export function createHandler(transport: LspTransport) {
  return {
    async handle(args: Record<string, unknown>) {
      const { destination, package: pkg, objectType } = args;

      // Validation
      if (typeof destination !== "string") {
        return {
          success: false,
          error: agentError(
            AgentErrorCode.INVALID_URI,
            "destination must be a string",
            String(destination),
          ),
        };
      }

      if (pkg !== undefined && typeof pkg !== "string") {
        return {
          success: false,
          error: agentError(
            AgentErrorCode.INVALID_URI,
            "package must be a string",
            String(pkg),
          ),
        };
      }

      if (objectType !== undefined && typeof objectType !== "string") {
        return {
          success: false,
          error: agentError(
            AgentErrorCode.INVALID_URI,
            "objectType must be a string",
            String(objectType),
          ),
        };
      }

      try {
        const result = await callLspContract(getInactiveObjects, transport, {
          destination,
          package: pkg,
          objectType,
        });
        return { success: true, data: result };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        let error;
        try {
          error = JSON.parse(message);
        } catch {
          error = agentError(AgentErrorCode.LSP_ERROR, message);
        }
        return {
          success: false,
          error: { ...error, destination },
        };
      }
    },
  };
}
