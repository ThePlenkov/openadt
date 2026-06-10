/**
 * Unlock file contract.
 * LSP method: adtLs/fileSystem/unlockFile
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const unlockFile = lspEndpoint({
  method: "adtLs/fileSystem/unlockFile",
  types: {
    params: type<{
      destination: string;
      uri: string;
    }>(),
    response: type<{ unlocked: boolean }>(),
  },
});
