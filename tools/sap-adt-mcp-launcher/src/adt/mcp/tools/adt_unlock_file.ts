/**
 * MCP tool contract for unlock file.
 * MCP layer on top of ADT LSP filesystem service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { unlockFile } from "../../services/adtLs/fileSystem/unlockFile.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtUnlockFile = mcpTool({
  name: "adt_unlock_file",
  description: "Unlock a file",
  types: {
    input: type<{ destination: string; uri: string }>(),
    output: type<{ unlocked: boolean }>(),
  },
});

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: { destination: string; uri: string }) {
      return await callLspContract(unlockFile, transport, params);
    },
  };
}
