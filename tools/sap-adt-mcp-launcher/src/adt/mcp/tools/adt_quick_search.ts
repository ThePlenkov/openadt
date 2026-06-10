/**
 * MCP tool contract for repository quick search.
 * MCP layer on top of ADT LSP repository service.
 */
import { mcpTool, type, Infer } from "../../../mcp/contract/contract-core.js";
import { quickSearch } from "../../services/adtLs/repository/quickSearch.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";
import {
  AgentErrorCode,
  agentError,
} from "../../../service/agent/error-codes.js";

export const adt_quick_search = mcpTool({
  name: "adt_quick_search",
  description: "Quick search in the ABAP repository",
  types: {
    input: type<{
      destination: string;
      pattern: string;
      types?: string[];
      maxResults?: number;
    }>(),
    output: type<{
      success: boolean;
      references?: Array<{
        name: string;
        type: string;
        uri: string;
      }>;
    }>(),
  },
});

export const inputSchema = {
  type: "object",
  properties: {
    destination: { type: "string", description: "SAP destination" },
    searchTerm: {
      type: "string",
      description: "Search term (e.g., 'Z*', 'CLAS*')",
    },
    objectType: {
      type: "string",
      description: "Object type filter (e.g., 'CLAS', 'PROG')",
    },
    package: { type: "string", description: "Package filter" },
    maxResults: {
      type: "number",
      description: "Maximum results (default: 50)",
    },
  },
  required: ["destination", "searchTerm"],
} as const;

export function createHandler(transport: LspTransport) {
  return {
    async handle(args: Record<string, unknown>) {
      const {
        destination,
        searchTerm,
        objectType,
        package: pkg,
        maxResults,
      } = args;

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

      if (typeof searchTerm !== "string") {
        return {
          success: false,
          error: agentError(
            AgentErrorCode.INVALID_URI,
            "searchTerm must be a string",
            String(searchTerm),
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

      if (maxResults !== undefined) {
        if (
          typeof maxResults !== "number" ||
          maxResults < 1 ||
          maxResults > 1000
        ) {
          return {
            success: false,
            error: agentError(
              AgentErrorCode.INVALID_URI,
              "maxResults must be a number between 1 and 1000",
              String(maxResults),
            ),
          };
        }
      }

      try {
        const result = await callLspContract(quickSearch, transport, {
          destination,
          pattern: searchTerm,
          types: objectType ? [objectType] : [],
          maxResults: maxResults ?? 50,
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
