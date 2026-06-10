/**
 * Agent tool registry and envelope for LSP-based MCP tools.
 * Provides a standardized interface for registering and executing tools
 * that call LSP methods on the SAP ADT Language Server.
 */
import type { MessageConnection } from "../../infra/rpc";
import type { McpLog } from "../../infra/log";

export interface AgentTool {
  name: string;
  description: string;
  inputSchema: object;
  handle: (
    args: Record<string, unknown>,
    ctx: AgentContext,
  ) => Promise<AgentResult>;
}

export interface AgentContext {
  lspConnection: MessageConnection;
  destination: string;
  log?: McpLog;
}

export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; destination?: string };
}

export class AgentRegistry {
  private tools = new Map<string, AgentTool>();

  register(tool: AgentTool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
  }

  registerToolSet(toolSet: AgentToolSet): void {
    toolSet.register(this);
  }

  get(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  list(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }
}

/**
 * Base class for agent tool sets. Each domain (ATC, lock, format, etc.)
 * extends this class and implements the register method.
 */
export abstract class AgentToolSet {
  abstract register(registry: AgentRegistry): void;
}
