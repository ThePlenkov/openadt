/**
 * MCP tool contract for get package name.
 * MCP layer on top of ADT LSP filesystem service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { getPackageName } from "../../services/adtLs/fileSystem/getPackageName.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtGetPackageName = mcpTool({
  name: "adt_get_package_name",
  description: "Get package name from URI",
  types: {
    input: type<{ destination: string; uri: string }>(),
    output: type<{ success: boolean; package: string }>(),
  },
});

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: { destination: string; uri: string }) {
      return await callLspContract(getPackageName, transport, params);
    },
  };
}
