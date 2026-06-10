/**
 * MCP tool contract for get check variants.
 * MCP layer on top of ADT LSP ATC service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { getCheckVariants } from "../../services/adtLs/atc/getCheckVariants.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";
import { AgentErrorCode, agentError } from "../../../service/agent/error-codes.js";

export const adt_get_check_variants = mcpTool({
  name: "adt_get_check_variants",
  description: "Get ATC check variants",
  types: {
    input: type<{ destination: string }>(),
    output: type<string[]>(),
  },
});

export const inputSchema = {
  type: "object",
  properties: {
    destination: { type: "string", description: "SAP destination" },
  },
  required: ["destination"],
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


    },
  };
}
