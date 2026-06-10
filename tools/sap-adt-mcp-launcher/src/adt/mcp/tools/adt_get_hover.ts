/**
 * MCP tool for adt get hover.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod';
import { getHover } from "../../services/adtLs/hover/getHover.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

// Zod schema (single source of truth)
const schema = z.object({
  destination: z.string().describe("SAP destination"),
  uri: z.string().describe("Object URI"),
});

// Tool definition for MCP SDK registration
export const adt_get_hover = {
  name: "adt_get_hover",
  description: "Get hover documentation",
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const lspResult = await callLspContract(
        getHover,
        transport,
        { destination: args.destination,
          uri: args.uri },
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
