/**
 * MCP tool contract for getting inactive objects.
 * MCP layer on top of ADT LSP activation service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { getInactiveObjects } from "../../services/adtLs/activation/getInactiveObjects.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtGetInactiveObjects = mcpTool({
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

/**
 * Handler implementation for the MCP tool.
 * Bridges MCP contract to LSP contract.
 */
export function createHandler(transport: LspTransport) {
  return {
    async handle(params: {
      destination: string;
      package?: string;
      objectType?: string;
    }) {
      return await callLspContract(getInactiveObjects, transport, params);
    },
  };
}
