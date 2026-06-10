/**
 * MCP tool contract for run check.
 * MCP layer on top of ADT LSP ATC service.
 */
import { mcpTool, type, Infer } from "../../../mcp/contract/contract-core.js";
import { runCheck as atcRunCheck } from "../../services/adtLs/atc/runCheck.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";
import { AgentErrorCode, agentError } from "../../../service/agent/error-codes.js";

export const adt_run_check = mcpTool({
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

export const inputSchema = {
  type: "object",
  properties: {
    destination: { type: "string", description: "SAP destination" },
    uris: { type: "array", items: { type: "string" }, description: "Object URIs" },
    variant: { type: "string", description: "Check variant (optional)" },
  },
  required: ["destination", "uris"],
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

        if (!Array.isArray(params.uris)) {
          return {
            success: false,
            error: agentError(
              AgentErrorCode.INVALID_URI,
              "uris must be an array",
              String(params.uris),
            ),
          };
        }


      uris: string[];
      variant?: string;
    }) {
        try {
          const result = await callLspContract(
    },
  };
}
