/**
 * MCP tool contract for assigning transport.
 * MCP layer on top of ADT LSP transport service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { assignTransportToObject } from "../../services/adtLs/transport/assignTransportToObject.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtAssignTransport = mcpTool({
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

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: {
      destination: string;
      uri: string;
      transportId: string;
    }) {
      return await callLspContract(assignTransportToObject, transport, params);
    },
  };
}
