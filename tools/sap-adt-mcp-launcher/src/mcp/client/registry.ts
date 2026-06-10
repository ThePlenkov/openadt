/**
 * MCP tool registry and envelope for contract-based MCP tools.
 * Provides a standardized interface for registering and executing tools
 * that use LSP contracts via the transport layer.
 */
import type { LspTransport } from "../../lsp/client/lsp-transport.js";
import type { McpLog } from "../../infra/log";

export interface McpTool {
  name: string;
  description: string;
  inputSchema: object;
  handle: (
    args: Record<string, unknown>,
    ctx: McpContext,
  ) => Promise<McpResult>;
}

export interface McpContext {
  transport: LspTransport;
  destination: string;
  log?: McpLog;
}

export interface McpResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; destination?: string };
}

export class McpToolRegistry {
  private tools = new Map<string, McpTool>();

  register(tool: McpTool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
  }

  registerToolSet(toolSet: McpToolSet): void {
    toolSet.register(this);
  }

  get(name: string): McpTool | undefined {
    return this.tools.get(name);
  }

  list(): McpTool[] {
    return Array.from(this.tools.values());
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }
}

/**
 * Base class for MCP tool sets. Each domain (activation, repository, etc.)
 * extends this class and implements the register method.
 */
export abstract class McpToolSet {
  abstract register(registry: McpToolRegistry): void;
}
