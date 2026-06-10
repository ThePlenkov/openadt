/**
 * MCP tool contract for get folder URI.
 * MCP layer on top of ADT LSP filesystem service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { getFolderUri } from "../../services/adtLs/fileSystem/getFolderUri.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtGetFolderUri = mcpTool({
  name: "adt_get_folder_uri",
  description: "Get folder URI from object URI",
  types: {
    input: type<{ destination: string; uri: string }>(),
    output: type<{ success: boolean; folderUri: string }>(),
  },
});

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: { destination: string; uri: string }) {
      return await callLspContract(getFolderUri, transport, params);
    },
  };
}
