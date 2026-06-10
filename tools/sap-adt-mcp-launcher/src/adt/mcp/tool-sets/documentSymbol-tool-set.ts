/**
 * DocumentSymbolToolSet for MCP registry.
 */
import type {
  McpToolRegistry,
  McpContext,
} from "../../../mcp/client/registry.js";
import { McpToolSet } from "../../../mcp/client/registry.js";
import {
  adt_document_symbols,
  inputSchema as adt_document_symbols_schema,
} from "../tools/adt_document_symbols.js";
import { createHandler as adt_document_symbols_handler } from "../tools/adt_document_symbols.js";

export class DocumentSymbolToolSet extends McpToolSet {
  register(registry: McpToolRegistry): void {
    registry.register({
      name: adt_document_symbols.name,
      description: adt_document_symbols.description,
      inputSchema: adt_document_symbols_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_document_symbols_handler(ctx.transport);
        return await handler.handle(args);
      },
    });
  }
}
