/**
 * Get external links contract.
 * LSP method: adtLs/fileSystem/getExternalLinks
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const getExternalLinks = lspEndpoint({
  method: "adtLs/fileSystem/getExternalLinks",
  types: {
    params: type<{
      destination: string;
      uri: string;
    }>(),
    response: type<{
      success: boolean;
      links: Array<{ name: string; url: string }>;
    }>(),
  },
});
