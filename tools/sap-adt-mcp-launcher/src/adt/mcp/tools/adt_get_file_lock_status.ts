/**
 * MCP tool contract for get file lock status.
 * MCP layer on top of ADT LSP filesystem service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { getFileLockStatus } from "../../services/adtLs/fileSystem/getFileLockStatus.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtGetFileLockStatus = mcpTool({
  name: "adt_get_file_lock_status",
  description: "Get file lock status",
  types: {
    input: type<{ destination: string; uri: string }>(),
    output: type<{
      locked: boolean;
      lockedBy?: string;
      lockedAt?: string;
    }>(),
  },
});

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: { destination: string; uri: string }) {
      return await callLspContract(getFileLockStatus, transport, params);
    },
  };
}
