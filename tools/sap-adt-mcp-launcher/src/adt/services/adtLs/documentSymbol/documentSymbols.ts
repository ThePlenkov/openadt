/**
 * Document symbols contract.
 * LSP method: adtLs/documentSymbol/documentSymbols
 */
import { lspEndpoint, type } from "../../lsp/contract/contract-core.js";

export const documentSymbols = lspEndpoint({
  method: "adtLs/documentSymbol/documentSymbols",
  types: {
    params: type<{
      destination: string;
      uri: string;
    }>(),
    response: type<{
      success: boolean;
      symbols: Array<{
        name: string;
        kind: string;
        detail?: string;
        range: {
          start: { line: number; character: number };
          end: { line: number; character: number };
        };
        children?: unknown[];
      }>;
    }>(),
  },
});
