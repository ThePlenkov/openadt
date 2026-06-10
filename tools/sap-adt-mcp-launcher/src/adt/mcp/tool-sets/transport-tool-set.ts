/**
 * TransportToolSet for MCP registry.
 */
import type { McpToolRegistry, McpContext } from "../../../mcp/client/registry.js";
import { McpToolSet } from "../../../mcp/client/registry.js";
import { adt_search_transports_simple, inputSchema as adt_search_transports_simple_schema } from "../tools/adt_search_transports_simple.js";
import { adt_search_transports, inputSchema as adt_search_transports_schema } from "../tools/adt_search_transports.js";
import { adt_check_transport_lock, inputSchema as adt_check_transport_lock_schema } from "../tools/adt_check_transport_lock.js";
import { adt_create_transport, inputSchema as adt_create_transport_schema } from "../tools/adt_create_transport.js";
import { adt_assign_transport, inputSchema as adt_assign_transport_schema } from "../tools/adt_assign_transport.js";
import { createHandler as adt_search_transports_simple_handler } from "../tools/adt_search_transports_simple.js";
import { createHandler as adt_search_transports_handler } from "../tools/adt_search_transports.js";
import { createHandler as adt_check_transport_lock_handler } from "../tools/adt_check_transport_lock.js";
import { createHandler as adt_create_transport_handler } from "../tools/adt_create_transport.js";
import { createHandler as adt_assign_transport_handler } from "../tools/adt_assign_transport.js";

export class TransportToolSet extends McpToolSet {
  register(registry: McpToolRegistry): void {
    registry.register({
      name: adt_search_transports_simple.name,
      description: adt_search_transports_simple.description,
      inputSchema: adt_search_transports_simple_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_search_transports_simple_handler(ctx.transport);
        return await handler.handle(args);
      },
    });

    registry.register({
      name: adt_search_transports.name,
      description: adt_search_transports.description,
      inputSchema: adt_search_transports_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_search_transports_handler(ctx.transport);
        return await handler.handle(args);
      },
    });

    registry.register({
      name: adt_check_transport_lock.name,
      description: adt_check_transport_lock.description,
      inputSchema: adt_check_transport_lock_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_check_transport_lock_handler(ctx.transport);
        return await handler.handle(args);
      },
    });

    registry.register({
      name: adt_create_transport.name,
      description: adt_create_transport.description,
      inputSchema: adt_create_transport_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_create_transport_handler(ctx.transport);
        return await handler.handle(args);
      },
    });

    registry.register({
      name: adt_assign_transport.name,
      description: adt_assign_transport.description,
      inputSchema: adt_assign_transport_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_assign_transport_handler(ctx.transport);
        return await handler.handle(args);
      },
    });
  }
}
