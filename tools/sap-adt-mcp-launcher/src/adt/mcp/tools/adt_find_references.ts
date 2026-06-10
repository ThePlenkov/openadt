/**
 * MCP tool for adt find references.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod';
import { findReferences } from "../../services/adtLs/references/findReferences.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

// Zod schema (single source of truth)
const schema = z.object({
  destination: z.string().describe("SAP destination"),
  uri: z.string().describe("Object URI"),
});

// Tool definition for MCP SDK registration
export const adt_find_references = {
  name: "adt_find_references",
  description: "Find usages of an object",
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const lspResult = await callLspContract(
        findReferences,
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
