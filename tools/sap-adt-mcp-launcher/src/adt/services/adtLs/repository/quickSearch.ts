/**
 * Repository quick search contract.
 * LSP method: adtLs/repository/quickSearch
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";
import type { QuickSearchResult } from "../../../config/types";

export const quickSearch = lspEndpoint({
  method: "adtLs/repository/quickSearch",
  types: {
    params: type<{
      destination: string;
      pattern: string;
      types?: string[];
      maxResults?: number;
    }>(),
    response: type<QuickSearchResult>(),
  },
});
