/**
 * Get file lock status contract.
 * LSP method: adtLs/fileSystem/getFileLockStatus
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const getFileLockStatus = lspEndpoint({
  method: "adtLs/fileSystem/getFileLockStatus",
  types: {
    params: type<{
      destination: string;
      uri: string;
    }>(),
    response: type<{
      locked: boolean;
      lockedBy?: string;
      lockedAt?: string;
    }>(),
  },
});
