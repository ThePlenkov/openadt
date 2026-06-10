/**
 * Shared exports for read tools.
 * Used by stdio-proxy to inject read tools into MCP.
 */
import {
  readObjectToolDef,
  handleReadObjectTool,
  READ_OBJECT_TOOL,
} from "./tools/read-object";
import {
  searchObjectsToolDef,
  handleSearchObjectsTool,
  SEARCH_OBJECTS_TOOL,
} from "./tools/search-objects";
import type { ReadObjectBackend } from "./client";
import type { CallToolResult } from "./mapping";

export { READ_OBJECT_TOOL, SEARCH_OBJECTS_TOOL };

/** MCP tool definitions to merge into the backend's `tools/list`. */
export function readToolDefs(): object[] {
  return [readObjectToolDef(), searchObjectsToolDef()];
}

/** Whether `name` is one of our injected read tools. */
export function isReadTool(name: string): boolean {
  return name === READ_OBJECT_TOOL || name === SEARCH_OBJECTS_TOOL;
}

/** Run a read tool call against `backend` and shape the MCP CallToolResult. */
export async function handleReadToolCall(
  backend: ReadObjectBackend,
  request: { name: string; args: Record<string, unknown> },
): Promise<CallToolResult> {
  try {
    if (request.name === READ_OBJECT_TOOL) {
      return await handleReadObjectTool(backend, request.args);
    }
    if (request.name === SEARCH_OBJECTS_TOOL) {
      return await handleSearchObjectsTool(backend, request.args);
    }
    return {
      content: [{ type: "text", text: `Unknown read tool: ${request.name}` }],
      isError: true,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: message }],
      isError: true,
    };
  }
}

// Re-export client and mapping for direct use
export * from "./client";
export * from "./mapping";
