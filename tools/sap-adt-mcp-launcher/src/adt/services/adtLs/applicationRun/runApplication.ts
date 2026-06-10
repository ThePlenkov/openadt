/**
 * Application run contract.
 * LSP method: adtLs/applicationRun/runApplication
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const runApplication = lspEndpoint({
  method: "adtLs/applicationRun/runApplication",
  types: {
    params: type<{
      destination: string;
      uri: string;
    }>(),
    response: type<{
      success: boolean;
      output: string;
      exitCode?: number;
    }>(),
  },
});
