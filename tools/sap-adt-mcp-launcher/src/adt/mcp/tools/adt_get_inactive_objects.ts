/**
 * MCP tool for getting inactive objects.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod';
import { tool } from '../tool-factory.js';
import { getInactiveObjects } from "../../services/adtLs/activation/getInactiveObjects.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

// Zod schema (single source of truth)
const schema = z.object({
  destination: z.string().describe("SAP destination"),
  package: z.string().optional().describe("Package filter (optional)"),
  objectType: z.string().optional().describe("Object type filter (optional)"),
});

// Tool definition for MCP SDK registration
export const adt_get_inactive_objects = tool({
  name: "adt_get_inactive_objects",
  description: "Get list of inactive objects in the current request",
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const lspResult = await callLspContract(
        getInactiveObjects,
        transport,
        {
          destination: args.destination,
          package: args.package,
          objectType: args.objectType,
        },
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
});
