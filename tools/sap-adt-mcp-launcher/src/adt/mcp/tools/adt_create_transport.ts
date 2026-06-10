/**
 * MCP tool contract for creating transport.
 * MCP layer on top of ADT LSP transport service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { createTransportForObjectLock } from "../../services/adtLs/transport/createTransportForObjectLock.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtCreateTransport = mcpTool({
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

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: {
      destination: string;
      uri: string;
      transportType: "workbench" | "customizing";
      description?: string;
    }) {
      return await callLspContract(
        createTransportForObjectLock,
        transport,
        params,
      );
    },
  };
}
