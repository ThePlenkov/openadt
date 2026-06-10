/**
 * Transport management tools.
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
import { parseAdtUri } from "../uri-helper";

/**
 * Transport tool set for agent registry.
 */
export class TransportToolSet implements AgentToolSet {
  register(registry: AgentRegistry): void {
    registry.register({
      name: "adt_check_transport_lock",
      description: "Check if a transport is required for an object lock",
      inputSchema: {
        type: "object",
        properties: {
          destination: { type: "string", description: "SAP destination" },
          uri: { type: "string", description: "ADT URI of the object" },
        },
        required: ["destination", "uri"],
      },
      handle: async (args, ctx) => this.handleCheckTransportLock(args, ctx),
    });

    registry.register({
      name: "adt_create_transport",
      description: "Create a transport for object lock",
      inputSchema: {
        type: "object",
        properties: {
          destination: { type: "string", description: "SAP destination" },
          uri: { type: "string", description: "ADT URI of the object" },
          transportType: {
            type: "string",
            enum: ["workbench", "customizing"],
            description: "Type of transport",
          },
          description: { type: "string", description: "Transport description" },
        },
        required: ["destination", "uri", "transportType"],
      },
      handle: async (args, ctx) => this.handleCreateTransport(args, ctx),
    });

    registry.register({
      name: "adt_assign_transport",
      description: "Assign a transport to an object",
      inputSchema: {
        type: "object",
        properties: {
          destination: { type: "string", description: "SAP destination" },
          uri: { type: "string", description: "ADT URI of the object" },
          transportId: {
            type: "string",
            description: "Transport ID (e.g., 'DEVK900001')",
          },
        },
        required: ["destination", "uri", "transportId"],
      },
      handle: async (args, ctx) => this.handleAssignTransport(args, ctx),
    });
  }

  private async handleCheckTransportLock(
    args: Record<string, unknown>,
    ctx: AgentContext,
  ): Promise<AgentResult> {
    const { destination, uri } = args;

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

    if (typeof uri !== "string") {
      return {
        success: false,
        error: agentError(
          AgentErrorCode.INVALID_URI,
          "uri must be a string",
          String(uri),
        ),
      };
    }

    parseAdtUri(uri); // Validate URI format

    try {
      const result = await callLspMethod<{
        requiresTransport: boolean;
        transportId?: string;
      }>(
        ctx.lspConnection,
        "adt/transport/checkTransportForObjectLock",
        { destination, uri },
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
        if (message.includes("transport") || message.includes("TRANSPORT")) {
          error = agentError(AgentErrorCode.NO_TRANSPORT, message);
        }
      } catch {
        error = agentError(AgentErrorCode.LSP_ERROR, message);
      }
      return {
        success: false,
        error: { ...error, destination },
      };
    }
  }

  private async handleCreateTransport(
    args: Record<string, unknown>,
    ctx: AgentContext,
  ): Promise<AgentResult> {
    const { destination, uri, transportType, description } = args;

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

    if (typeof uri !== "string") {
      return {
        success: false,
        error: agentError(
          AgentErrorCode.INVALID_URI,
          "uri must be a string",
          String(uri),
        ),
      };
    }

    if (typeof transportType !== "string") {
      return {
        success: false,
        error: agentError(
          AgentErrorCode.INVALID_URI,
          "transportType must be a string",
          String(transportType),
        ),
      };
    }

    if (transportType !== "workbench" && transportType !== "customizing") {
      return {
        success: false,
        error: agentError(
          AgentErrorCode.INVALID_URI,
          "transportType must be 'workbench' or 'customizing'",
          transportType,
        ),
      };
    }

    parseAdtUri(uri); // Validate URI format

    try {
      const result = await callLspMethod<{
        success: boolean;
        transportId: string;
      }>(
        ctx.lspConnection,
        "adt/transport/createTransportForObjectLock",
        {
          destination,
          uri,
          transportType,
          description: description ?? "",
        },
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
        if (message.includes("transport") || message.includes("TRANSPORT")) {
          error = agentError(AgentErrorCode.NO_TRANSPORT, message);
        }
      } catch {
        error = agentError(AgentErrorCode.LSP_ERROR, message);
      }
      return {
        success: false,
        error: { ...error, destination },
      };
    }
  }

  private async handleAssignTransport(
    args: Record<string, unknown>,
    ctx: AgentContext,
  ): Promise<AgentResult> {
    const { destination, uri, transportId } = args;

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

    if (typeof uri !== "string") {
      return {
        success: false,
        error: agentError(
          AgentErrorCode.INVALID_URI,
          "uri must be a string",
          String(uri),
        ),
      };
    }

    if (typeof transportId !== "string") {
      return {
        success: false,
        error: agentError(
          AgentErrorCode.INVALID_URI,
          "transportId must be a string",
          String(transportId),
        ),
      };
    }

    parseAdtUri(uri); // Validate URI format

    try {
      const result = await callLspMethod<{ success: boolean }>(
        ctx.lspConnection,
        "adt/transport/assignTransportToObject",
        { destination, uri, transportId },
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
