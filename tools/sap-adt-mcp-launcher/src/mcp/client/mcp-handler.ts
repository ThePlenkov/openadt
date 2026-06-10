/**
 * Generic MCP handler for contracts.
 * Provides type-safe handling for MCP tools, prompts, and resources.
 */
import type {
  McpToolSpec,
  McpPromptSpec,
  McpResourceSpec,
} from "../contract/contract-core.js";
import type { McpToolInput, McpToolOutput } from "../contract/client-types.js";

/**
 * Handler interface for MCP tools.
 */
export interface McpToolHandler<E extends McpToolSpec> {
  handle(params: McpToolInput<E>): Promise<McpToolOutput<E>>;
}

/**
 * Generic MCP tool caller.
 * Calls an MCP tool handler with type-safe parameters.
 */
export async function callMcpTool<E extends McpToolSpec>(
  handler: McpToolHandler<E>,
  params: McpToolInput<E>,
): Promise<McpToolOutput<E>> {
  return handler.handle(params);
}
