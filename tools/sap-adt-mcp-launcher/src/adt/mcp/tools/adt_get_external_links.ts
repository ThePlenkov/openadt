/**
 * MCP tool contract for get external links.
 * MCP layer on top of ADT LSP filesystem service.
 */
import { mcpTool, type, Infer } from "../../../mcp/contract/contract-core.js";
import { getExternalLinks } from "../../services/adtLs/fileSystem/getExternalLinks.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";
import {
  AgentErrorCode,
  agentError,
} from "../../../service/agent/error-codes.js";

export const adt_get_external_links = mcpTool({
  name: "adt_get_external_links",
  description: "Get external links for an object",
  types: {
    input: type<Infer<typeof inputSchema>>(),
    output: type<{
      success: boolean;
      links: Array<{ name: string; url: string }>;
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
    },
  };
}
