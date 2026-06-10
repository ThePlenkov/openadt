/**
 * MCP tool contract for toggle version.
 * MCP layer on top of ADT LSP filesystem service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { toggleVersion } from "../../services/adtLs/fileSystem/toggleVersion.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtToggleVersion = mcpTool({
  name: "adt_toggle_version",
  description: "Toggle active/inactive version",
  types: {
    input: type<{ destination: string; uri: string }>(),
    output: type<{ success: boolean; isActive: boolean }>(),
  },
});

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: { destination: string; uri: string }) {
      return await callLspContract(toggleVersion, transport, params);
    },
  };
}
