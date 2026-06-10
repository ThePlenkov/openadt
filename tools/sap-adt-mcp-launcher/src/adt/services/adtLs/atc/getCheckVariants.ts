/**
 * Get check variants contract.
 * LSP method: adtLs/atc/getCheckVariants
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const getCheckVariants = lspEndpoint({
  method: "adtLs/atc/getCheckVariants",
  types: {
    params: type<{
      destination: string;
    }>(),
    response: type<string[]>(),
  },
});
