/**
 * Transport search tools (extension to transport-tools.ts).
 * Calls LSP methods from AdtLsTransportExtension.
 */
import {
  AgentRegistry,
  AgentToolSet,
  type AgentContext,
  type AgentResult,
} from "../registry";
import { callLspMethod } from "../lsp-caller";
import { AgentErrorCode, agentError } from "../error-codes";

/**
 * Transport search tool set for agent registry.
 */
export class TransportSearchToolSet implements AgentToolSet {
  register(registry: AgentRegistry): void {
    registry.register({
      name: "adt_search_transports",
      description: "Simple search for transports",
      inputSchema: {
        type: "object",
        properties: {
          destination: { type: "string", description: "SAP destination" },
          user: { type: "string", description: "User filter (optional)" },
          status: {
            type: "string",
            enum: ["modifiable", "released", "all"],
            description: "Transport status filter",
          },
        },
        required: ["destination"],
      },
      handle: async (args, ctx) => this.handleSearchTransports(args, ctx),
    });

    registry.register({
      name: "adt_search_transports_advanced",
      description: "Advanced search for transports",
      inputSchema: {
        type: "object",
        properties: {
          destination: { type: "string", description: "SAP destination" },
          user: { type: "string", description: "User filter" },
          status: {
            type: "string",
            enum: ["modifiable", "released", "all"],
            description: "Transport status filter",
          },
          targetSystem: { type: "string", description: "Target system filter" },
          transportType: {
            type: "string",
            description: "Transport type filter",
          },
        },
        required: ["destination"],
      },
      handle: async (args, ctx) =>
        this.handleSearchTransportsAdvanced(args, ctx),
    });
  }

  private async handleSearchTransports(
    args: Record<string, unknown>,
    ctx: AgentContext,
  ): Promise<AgentResult> {
    const { destination, user, status } = args;

    if (typeof destination !== "string") {
      return {
        success: false,
        error: agentError(
          AgentErrorCode.INVALID_URI,
          "destination must be a string",
          String(destination),
        ),
      };
    }

    if (user !== undefined && typeof user !== "string") {
      return {
        success: false,
        error: agentError(
          AgentErrorCode.INVALID_URI,
          "user must be a string",
          String(user),
        ),
      };
    }

    if (status !== undefined) {
      if (typeof status !== "string") {
        return {
          success: false,
          error: agentError(
            AgentErrorCode.INVALID_URI,
            "status must be a string",
            String(status),
          ),
        };
      }
      if (!["modifiable", "released", "all"].includes(status)) {
        return {
          success: false,
          error: agentError(
            AgentErrorCode.INVALID_URI,
            "status must be 'modifiable', 'released', or 'all'",
            status,
          ),
        };
      }
    }

    try {
      const result = await callLspMethod<{
        success: boolean;
        transports: Array<{
          id: string;
          description: string;
          owner: string;
          status: string;
          targetSystem: string;
        }>;
      }>(
        ctx.lspConnection,
        "adt/transport/searchTransportsSimple",
        { destination, user, status },
        { log: ctx.log },
      );

      return {
        success: true,
        data: result,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      let error;
      try {
        error = JSON.parse(message);
      } catch {
        error = agentError(AgentErrorCode.LSP_ERROR, message);
      }
      return {
        success: false,
        error: { ...error, destination },
      };
    }
  }

  private async handleSearchTransportsAdvanced(
    args: Record<string, unknown>,
    ctx: AgentContext,
  ): Promise<AgentResult> {
    const { destination, user, status, targetSystem, transportType } = args;

    if (typeof destination !== "string") {
      return {
        success: false,
        error: agentError(
          AgentErrorCode.INVALID_URI,
          "destination must be a string",
          String(destination),
        ),
      };
    }

    if (user !== undefined && typeof user !== "string") {
      return {
        success: false,
        error: agentError(
          AgentErrorCode.INVALID_URI,
          "user must be a string",
          String(user),
        ),
      };
    }

    if (status !== undefined) {
      if (typeof status !== "string") {
        return {
          success: false,
          error: agentError(
            AgentErrorCode.INVALID_URI,
            "status must be a string",
            String(status),
          ),
        };
      }
      if (!["modifiable", "released", "all"].includes(status)) {
        return {
          success: false,
          error: agentError(
            AgentErrorCode.INVALID_URI,
            "status must be 'modifiable', 'released', or 'all'",
            status,
          ),
        };
      }
    }

    if (targetSystem !== undefined && typeof targetSystem !== "string") {
      return {
        success: false,
        error: agentError(
          AgentErrorCode.INVALID_URI,
          "targetSystem must be a string",
          String(targetSystem),
        ),
      };
    }

    if (transportType !== undefined && typeof transportType !== "string") {
      return {
        success: false,
        error: agentError(
          AgentErrorCode.INVALID_URI,
          "transportType must be a string",
          String(transportType),
        ),
      };
    }

    try {
      const result = await callLspMethod<{
        success: boolean;
        transports: Array<{
          id: string;
          description: string;
          owner: string;
          status: string;
          targetSystem: string;
          type: string;
        }>;
      }>(
        ctx.lspConnection,
        "adt/transport/searchTransports",
        { destination, user, status, targetSystem, transportType },
        { log: ctx.log },
      );

      return {
        success: true,
        data: result,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      let error;
      try {
        error = JSON.parse(message);
      } catch {
        error = agentError(AgentErrorCode.LSP_ERROR, message);
      }
      return {
        success: false,
        error: { ...error, destination },
      };
    }
  }
}
