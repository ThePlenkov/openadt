/**
 * Activation tools.
 * Calls LSP method from AdtLsActivationExtension.
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
 * Activation tool set for agent registry.
 */
export class ActivationToolSet implements AgentToolSet {
  register(registry: AgentRegistry): void {
    registry.register({
      name: "adt_get_inactive_objects",
      description: "Get list of inactive objects in the current request",
      inputSchema: {
        type: "object",
        properties: {
          destination: { type: "string", description: "SAP destination" },
          package: { type: "string", description: "Package filter (optional)" },
          objectType: {
            type: "string",
            description: "Object type filter (optional)",
          },
        },
        required: ["destination"],
      },
      handle: async (args, ctx) => this.handleGetInactiveObjects(args, ctx),
    });
  }

  private async handleGetInactiveObjects(
    args: Record<string, unknown>,
    ctx: AgentContext,
  ): Promise<AgentResult> {
    const { destination, package: pkg, objectType } = args;

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

    if (pkg !== undefined && typeof pkg !== "string") {
      return {
        success: false,
        error: agentError(
          AgentErrorCode.INVALID_URI,
          "package must be a string",
          String(pkg),
        ),
      };
    }

    if (objectType !== undefined && typeof objectType !== "string") {
      return {
        success: false,
        error: agentError(
          AgentErrorCode.INVALID_URI,
          "objectType must be a string",
          String(objectType),
        ),
      };
    }

    try {
      const result = await callLspMethod<{
        success: boolean;
        objects: Array<{
          name: string;
          type: string;
          uri: string;
          package?: string;
        }>;
      }>(
        ctx.lspConnection,
        "adt/activation/getInactiveObjects",
        { destination, package: pkg, objectType },
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
