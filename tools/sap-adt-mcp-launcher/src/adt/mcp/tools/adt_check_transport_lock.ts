/**
 * MCP tool for adt check transport lock.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod';
import { tool } from '../tool-factory.js';
import { checkTransportForObjectLock } from "../../services/adtLs/transport/checkTransportForObjectLock.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

// Zod schema (single source of truth)
const schema = z.object({
  destination: z.string().describe("SAP destination"),
  uri: z.string().describe("Object URI"),
  transportId: z.string().describe("Transport ID"),
});

// Tool definition for MCP SDK registration
export const adt_check_transport_lock = tool({
  name: "adt_check_transport_lock",
  description: "Check if an object requires a transport",
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const lspResult = await callLspContract(
        checkTransportForObjectLock,
        transport,
        { destination: args.destination,
          uri: args.uri,
          transportId: args.transportId },
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
