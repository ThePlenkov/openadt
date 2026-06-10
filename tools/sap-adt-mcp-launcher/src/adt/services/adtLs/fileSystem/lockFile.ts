/**
 * Lock file contract.
 * LSP method: adtLs/fileSystem/lockFile
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const lockFile = lspEndpoint({
  method: "adtLs/fileSystem/lockFile",
  types: {
    params: type<{
      destination: string;
      uri: string;
    }>(),
    response: type<{
      locked: boolean;
      lockedBy?: string;
    }>(),
  },
});
