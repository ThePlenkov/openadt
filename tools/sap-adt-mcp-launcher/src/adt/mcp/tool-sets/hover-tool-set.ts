/**
 * HoverToolSet for MCP registry.
 */
import type { McpToolRegistry, McpContext } from "../../../mcp/client/registry.js";
import { McpToolSet } from "../../../mcp/client/registry.js";
import { adt_get_hover, inputSchema as adt_get_hover_schema } from "../tools/adt_get_hover.js";
import { createHandler as adt_get_hover_handler } from "../tools/adt_get_hover.js";

export class HoverToolSet extends McpToolSet {
  register(registry: McpToolRegistry): void {
    registry.register({
      name: adt_get_hover.name,
      description: adt_get_hover.description,
      inputSchema: adt_get_hover_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_get_hover_handler(ctx.transport);
        return await handler.handle(args);
      },
    });
  }
}
