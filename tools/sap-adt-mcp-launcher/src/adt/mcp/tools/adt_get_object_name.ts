/**
 * MCP tool contract for get object name.
 * MCP layer on top of ADT LSP filesystem service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { getObjectName } from "../../services/adtLs/fileSystem/getObjectName.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtGetObjectName = mcpTool({
  name: "adt_get_object_name",
  description: "Get object name from URI",
  types: {
    input: type<{ destination: string; uri: string }>(),
    output: type<{ success: boolean; name: string }>(),
  },
});

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: { destination: string; uri: string }) {
      return await callLspContract(getObjectName, transport, params);
    },
  };
}
