/**
 * MCP tool contract for checking transport lock.
 * MCP layer on top of ADT LSP transport service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { checkTransportForObjectLock } from "../../services/adtLs/transport/checkTransportForObjectLock.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtCheckTransportLock = mcpTool({
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

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: { destination: string; uri: string }) {
      return await callLspContract(
        checkTransportForObjectLock,
        transport,
        params,
      );
    },
  };
}
