/**
 * AtcToolSet for MCP registry.
 */
import type { McpToolRegistry, McpContext } from "../../../mcp/client/registry.js";
import { McpToolSet } from "../../../mcp/client/registry.js";
import { adt_get_check_variants, inputSchema as adt_get_check_variants_schema } from "../tools/adt_get_check_variants.js";
import { adt_run_check, inputSchema as adt_run_check_schema } from "../tools/adt_run_check.js";
import { createHandler as adt_get_check_variants_handler } from "../tools/adt_get_check_variants.js";
import { createHandler as adt_run_check_handler } from "../tools/adt_run_check.js";

export class AtcToolSet extends McpToolSet {
  register(registry: McpToolRegistry): void {
    registry.register({
      name: adt_get_check_variants.name,
      description: adt_get_check_variants.description,
      inputSchema: adt_get_check_variants_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_get_check_variants_handler(ctx.transport);
        return await handler.handle(args);
      },
    });

    registry.register({
      name: adt_run_check.name,
      description: adt_run_check.description,
      inputSchema: adt_run_check_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_run_check_handler(ctx.transport);
        return await handler.handle(args);
      },
    });
  }
}
