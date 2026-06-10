/**
 * MCP tool for adt quick search.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod';
import { quickSearch } from "../../services/adtLs/repository/quickSearch.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

// Zod schema (single source of truth)
const schema = z.object({
  destination: z.string().describe("SAP destination"),
  searchTerm: z.string().describe("Search term"),
});

// Tool definition for MCP SDK registration
export const adt_quick_search = {
  name: "adt_quick_search",
  description: "Quick search in the ABAP repository",
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const lspResult = await callLspContract(
        quickSearch,
        transport,
        { destination: args.destination,
          pattern: args.searchTerm },
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify(lspResult),
        }],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{
          type: "text",
          text: `Error: ${message}`,
        }],
        isError: true,
      };
    }
  },
};
