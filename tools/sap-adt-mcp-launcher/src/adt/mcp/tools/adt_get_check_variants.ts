/**
 * MCP tool for adt get check variants.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod';
import { getCheckVariants } from "../../services/adtLs/atc/getCheckVariants.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

// Zod schema (single source of truth)
const schema = z.object({
  destination: z.string().describe("SAP destination"),
});

// Tool definition for MCP SDK registration
export const adt_get_check_variants = {
  name: "adt_get_check_variants",
  description: "Get ATC check variants",
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const lspResult = await callLspContract(
        getCheckVariants,
        transport,
        { destination: args.destination },
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
