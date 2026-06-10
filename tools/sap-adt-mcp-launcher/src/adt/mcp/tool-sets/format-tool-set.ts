/**
 * FormatToolSet for MCP registry.
 */
import type {
  McpToolRegistry,
  McpContext,
} from "../../../mcp/client/registry.js";
import { McpToolSet } from "../../../mcp/client/registry.js";
import {
  adt_format,
  inputSchema as adt_format_schema,
} from "../tools/adt_format.js";
import { createHandler as adt_format_handler } from "../tools/adt_format.js";

export class FormatToolSet extends McpToolSet {
  register(registry: McpToolRegistry): void {
    registry.register({
      name: adt_format.name,
      description: adt_format.description,
      inputSchema: adt_format_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_format_handler(ctx.transport);
        return await handler.handle(args);
      },
    });
  }
}
