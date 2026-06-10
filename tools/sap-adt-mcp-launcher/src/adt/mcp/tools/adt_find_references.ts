/**
 * MCP tool contract for finding references.
 * MCP layer on top of ADT LSP references service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { findReferences } from "../../services/adtLs/references/findReferences.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";
import { AgentErrorCode, agentError } from "../../../service/agent/error-codes.js";

export const adt_find_references = mcpTool({
  name: "adt_find_references",
  description: "Find usages of an object",
  types: {
    input: type<{
      destination: string;
      uri: string;
      position?: {
        line: number;
        character: number;
      };
    }>(),
    output: type<{
      success: boolean;
      locations: Array<{
        uri: string;
        range: {
          start: { line: number; character: number };
          end: { line: number; character: number };
        };
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


      uri: string;
      position?: { line: number; character: number };
    }) {
        try {
          const result = await callLspContract(
    },
  };
}
