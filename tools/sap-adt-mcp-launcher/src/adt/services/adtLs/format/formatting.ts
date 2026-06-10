/**
 * Formatting contract.
 * LSP method: adtLs/format/formatting
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const formatting = lspEndpoint({
  method: "adtLs/format/formatting",
  types: {
    params: type<{
      destination: string;
      uri: string;
      content: string;
    }>(),
    response: type<{
      success: boolean;
      formattedContent: string;
    }>(),
  },
});
