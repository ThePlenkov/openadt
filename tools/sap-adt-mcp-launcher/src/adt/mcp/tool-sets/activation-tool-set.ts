/**
 * Activation tool set for MCP registry.
 */
import type {
  McpToolRegistry,
  McpContext,
  McpResult,
} from "../../../mcp/client/registry.js";
import { McpToolSet } from "../../../mcp/client/registry.js";
import {
  adt_get_inactive_objects,
  inputSchema,
} from "../tools/adt_get_inactive_objects.js";
import { createHandler } from "../tools/adt_get_inactive_objects.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";

export class ActivationToolSet extends McpToolSet {
  register(registry: McpToolRegistry): void {
    registry.register({
      name: adt_get_inactive_objects.name,
      description: adt_get_inactive_objects.description,
      inputSchema,
      handle: async (args, ctx: McpContext) => {
        const handler = createHandler(ctx.transport);
        return await handler.handle(args);
      },
    });
  }
}
