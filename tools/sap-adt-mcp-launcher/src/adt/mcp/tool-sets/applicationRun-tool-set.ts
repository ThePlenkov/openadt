/**
 * ApplicationRunToolSet for MCP registry.
 */
import type {
  McpToolRegistry,
  McpContext,
} from "../../../mcp/client/registry.js";
import { McpToolSet } from "../../../mcp/client/registry.js";
import {
  adt_run_application,
  inputSchema as adt_run_application_schema,
} from "../tools/adt_run_application.js";
import { createHandler as adt_run_application_handler } from "../tools/adt_run_application.js";

export class ApplicationRunToolSet extends McpToolSet {
  register(registry: McpToolRegistry): void {
    registry.register({
      name: adt_run_application.name,
      description: adt_run_application.description,
      inputSchema: adt_run_application_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_run_application_handler(ctx.transport);
        return await handler.handle(args);
      },
    });
  }
}
