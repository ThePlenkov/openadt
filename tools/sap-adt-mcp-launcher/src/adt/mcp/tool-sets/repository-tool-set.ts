/**
 * RepositoryToolSet for MCP registry.
 */
import type { McpToolRegistry, McpContext } from "../../../mcp/client/registry.js";
import { McpToolSet } from "../../../mcp/client/registry.js";
import { adt_quick_search, inputSchema as adt_quick_search_schema } from "../tools/adt_quick_search.js";
import { createHandler as adt_quick_search_handler } from "../tools/adt_quick_search.js";

export class RepositoryToolSet extends McpToolSet {
  register(registry: McpToolRegistry): void {
    registry.register({
      name: adt_quick_search.name,
      description: adt_quick_search.description,
      inputSchema: adt_quick_search_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_quick_search_handler(ctx.transport);
        return await handler.handle(args);
      },
    });
  }
}
