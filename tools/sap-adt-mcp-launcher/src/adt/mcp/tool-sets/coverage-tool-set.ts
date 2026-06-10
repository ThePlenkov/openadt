/**
 * CoverageToolSet for MCP registry.
 */
import type { McpToolRegistry, McpContext } from "../../../mcp/client/registry.js";
import { McpToolSet } from "../../../mcp/client/registry.js";
import { adt_get_coverage, inputSchema as adt_get_coverage_schema } from "../tools/adt_get_coverage.js";
import { adt_load_statement_results, inputSchema as adt_load_statement_results_schema } from "../tools/adt_load_statement_results.js";
import { createHandler as adt_get_coverage_handler } from "../tools/adt_get_coverage.js";
import { createHandler as adt_load_statement_results_handler } from "../tools/adt_load_statement_results.js";

export class CoverageToolSet extends McpToolSet {
  register(registry: McpToolRegistry): void {
    registry.register({
      name: adt_get_coverage.name,
      description: adt_get_coverage.description,
      inputSchema: adt_get_coverage_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_get_coverage_handler(ctx.transport);
        return await handler.handle(args);
      },
    });

    registry.register({
      name: adt_load_statement_results.name,
      description: adt_load_statement_results.description,
      inputSchema: adt_load_statement_results_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_load_statement_results_handler(ctx.transport);
        return await handler.handle(args);
      },
    });
  }
}
