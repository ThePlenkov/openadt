/**
 * FileSystemToolSet for MCP registry.
 */
import type {
  McpToolRegistry,
  McpContext,
} from "../../../mcp/client/registry.js";
import { McpToolSet } from "../../../mcp/client/registry.js";
import {
  adt_force_refresh,
  inputSchema as adt_force_refresh_schema,
} from "../tools/adt_force_refresh.js";
import {
  adt_get_object_name,
  inputSchema as adt_get_object_name_schema,
} from "../tools/adt_get_object_name.js";
import {
  adt_get_package_name,
  inputSchema as adt_get_package_name_schema,
} from "../tools/adt_get_package_name.js";
import {
  adt_get_folder_uri,
  inputSchema as adt_get_folder_uri_schema,
} from "../tools/adt_get_folder_uri.js";
import {
  adt_get_external_links,
  inputSchema as adt_get_external_links_schema,
} from "../tools/adt_get_external_links.js";
import {
  adt_lock_file,
  inputSchema as adt_lock_file_schema,
} from "../tools/adt_lock_file.js";
import {
  adt_unlock_file,
  inputSchema as adt_unlock_file_schema,
} from "../tools/adt_unlock_file.js";
import {
  adt_get_file_lock_status,
  inputSchema as adt_get_file_lock_status_schema,
} from "../tools/adt_get_file_lock_status.js";
import {
  adt_toggle_version,
  inputSchema as adt_toggle_version_schema,
} from "../tools/adt_toggle_version.js";
import { createHandler as adt_force_refresh_handler } from "../tools/adt_force_refresh.js";
import { createHandler as adt_get_object_name_handler } from "../tools/adt_get_object_name.js";
import { createHandler as adt_get_package_name_handler } from "../tools/adt_get_package_name.js";
import { createHandler as adt_get_folder_uri_handler } from "../tools/adt_get_folder_uri.js";
import { createHandler as adt_get_external_links_handler } from "../tools/adt_get_external_links.js";
import { createHandler as adt_lock_file_handler } from "../tools/adt_lock_file.js";
import { createHandler as adt_unlock_file_handler } from "../tools/adt_unlock_file.js";
import { createHandler as adt_get_file_lock_status_handler } from "../tools/adt_get_file_lock_status.js";
import { createHandler as adt_toggle_version_handler } from "../tools/adt_toggle_version.js";

export class FileSystemToolSet extends McpToolSet {
  register(registry: McpToolRegistry): void {
    registry.register({
      name: adt_force_refresh.name,
      description: adt_force_refresh.description,
      inputSchema: adt_force_refresh_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_force_refresh_handler(ctx.transport);
        return await handler.handle(args);
      },
    });

    registry.register({
      name: adt_get_object_name.name,
      description: adt_get_object_name.description,
      inputSchema: adt_get_object_name_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_get_object_name_handler(ctx.transport);
        return await handler.handle(args);
      },
    });

    registry.register({
      name: adt_get_package_name.name,
      description: adt_get_package_name.description,
      inputSchema: adt_get_package_name_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_get_package_name_handler(ctx.transport);
        return await handler.handle(args);
      },
    });

    registry.register({
      name: adt_get_folder_uri.name,
      description: adt_get_folder_uri.description,
      inputSchema: adt_get_folder_uri_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_get_folder_uri_handler(ctx.transport);
        return await handler.handle(args);
      },
    });

    registry.register({
      name: adt_get_external_links.name,
      description: adt_get_external_links.description,
      inputSchema: adt_get_external_links_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_get_external_links_handler(ctx.transport);
        return await handler.handle(args);
      },
    });

    registry.register({
      name: adt_lock_file.name,
      description: adt_lock_file.description,
      inputSchema: adt_lock_file_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_lock_file_handler(ctx.transport);
        return await handler.handle(args);
      },
    });

    registry.register({
      name: adt_unlock_file.name,
      description: adt_unlock_file.description,
      inputSchema: adt_unlock_file_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_unlock_file_handler(ctx.transport);
        return await handler.handle(args);
      },
    });

    registry.register({
      name: adt_get_file_lock_status.name,
      description: adt_get_file_lock_status.description,
      inputSchema: adt_get_file_lock_status_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_get_file_lock_status_handler(ctx.transport);
        return await handler.handle(args);
      },
    });

    registry.register({
      name: adt_toggle_version.name,
      description: adt_toggle_version.description,
      inputSchema: adt_toggle_version_schema,
      handle: async (args, ctx: McpContext) => {
        const handler = adt_toggle_version_handler(ctx.transport);
        return await handler.handle(args);
      },
    });
  }
}
