/**
 * MCP tool for adt get object name.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod';
import { tool } from '../tool-factory.js';
import { getObjectName } from "../../services/adtLs/fileSystem/getObjectName.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

// Zod schema (single source of truth)
const schema = z.object({
  destination: z.string().describe("SAP destination"),
  uri: z.string().describe("Object URI"),
});

// Tool definition for MCP SDK registration
export const adt_get_object_name = tool({
  name: "adt_get_object_name",
  description: "Get object name from URI",
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const lspResult = await callLspContract(
        getObjectName,
        transport,
        { destination: args.destination,
          uri: args.uri },
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify(lspResult, null, 2),
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
