/**
 * Run check contract.
 * LSP method: adtLs/atc/runCheck
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const runCheck = lspEndpoint({
  method: "adtLs/atc/runCheck",
  types: {
    params: type<{
      destination: string;
      uris: string[];
      variant?: string;
    }>(),
    response: type<{
      success: boolean;
      findings: unknown[];
    }>(),
  },
});
