/**
 * ReferencesToolSet for MCP registry.
 */
import type {
  McpToolRegistry,
  McpContext,
} from "../../../mcp/client/registry.js";
import { McpToolSet } from "../../../mcp/client/registry.js";
import {
  adt_find_references,
  inputSchema as adt_find_references_schema,
} from "../tools/adt_find_references.js";
import { createHandler as adt_find_references_handler } from "../tools/adt_find_references.js";

export class ReferencesToolSet extends McpToolSet {
  register(registry: McpToolRegistry): void {
    registry.register({
      name: adt_find_references.name,
      description: adt_find_references.description,
      inputSchema: adt_find_references_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_find_references_handler(ctx.transport);
        return await handler.handle(args);
      },
    });
  }
}
