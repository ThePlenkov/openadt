/**
 * MCP tool contract for lock file.
 * MCP layer on top of ADT LSP filesystem service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { lockFile } from "../../services/adtLs/fileSystem/lockFile.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtLockFile = mcpTool({
  name: "adt_lock_file",
  description: "Lock a file",
  types: {
    input: type<{ destination: string; uri: string }>(),
    output: type<{ locked: boolean; lockedBy?: string }>(),
  },
});

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: { destination: string; uri: string }) {
      return await callLspContract(lockFile, transport, params);
    },
  };
}
