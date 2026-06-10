/**
 * DiagnosticToolSet for MCP registry.
 */
import type { McpToolRegistry, McpContext } from "../../../mcp/client/registry.js";
import { McpToolSet } from "../../../mcp/client/registry.js";
import { adt_diagnostic, inputSchema as adt_diagnostic_schema } from "../tools/adt_diagnostic.js";
import { createHandler as adt_diagnostic_handler } from "../tools/adt_diagnostic.js";

export class DiagnosticToolSet extends McpToolSet {
  register(registry: McpToolRegistry): void {
    registry.register({
      name: adt_diagnostic.name,
      description: adt_diagnostic.description,
      inputSchema: adt_diagnostic_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_diagnostic_handler(ctx.transport);
        return await handler.handle(args);
      },
    });
  }
}
