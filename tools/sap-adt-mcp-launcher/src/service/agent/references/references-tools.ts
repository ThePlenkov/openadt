/**
 * References tool.
 * Calls LSP method from AdtLsReferences.
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
import { AgentThrottle } from "../throttle";

/**
 * References tool set for agent registry.
 */
export class ReferencesToolSet implements AgentToolSet {
  private throttle = new AgentThrottle(4, 1000);

  register(registry: AgentRegistry): void {
    registry.register({
      name: "adt_find_references",
      description: "Find all usages/references of an ABAP object",
      inputSchema: {
        type: "object",
        properties: {
          destination: { type: "string", description: "SAP destination" },
          uri: { type: "string", description: "ADT URI of the object" },
          position: {
            type: "object",
            properties: {
              line: { type: "number", description: "Line number (0-based)" },
              character: {
                type: "number",
                description: "Character position (0-based)",
              },
            },
            description: "Position in the document (optional)",
          },
        },
        required: ["destination", "uri"],
      },
      handle: async (args, ctx) => this.handleFindReferences(args, ctx),
    });
  }

  private async handleFindReferences(
    args: Record<string, unknown>,
    ctx: AgentContext,
  ): Promise<AgentResult> {
    const { destination, uri, position } = args;

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

    // Validate position if provided
    if (position !== undefined) {
      if (typeof position !== "object" || position === null) {
        return {
          success: false,
          error: agentError(
            AgentErrorCode.INVALID_URI,
            "position must be an object",
            String(position),
          ),
        };
      }
      const pos = position as Record<string, unknown>;
      if (
        pos.line !== undefined &&
        (typeof pos.line !== "number" || pos.line < 0)
      ) {
        return {
          success: false,
          error: agentError(
            AgentErrorCode.INVALID_URI,
            "position.line must be a non-negative number",
            String(pos.line),
          ),
        };
      }
      if (
        pos.character !== undefined &&
        (typeof pos.character !== "number" || pos.character < 0)
      ) {
        return {
          success: false,
          error: agentError(
            AgentErrorCode.INVALID_URI,
            "position.character must be a non-negative number",
            String(pos.character),
          ),
        };
      }
    }

    // Throttle to prevent server overload
    await this.throttle.acquire(destination);

    try {
      const result = await callLspMethod<{
        success: boolean;
        locations: Array<{
          uri: string;
          range: {
            start: { line: number; character: number };
            end: { line: number; character: number };
          };
        }>;
      }>(
        ctx.lspConnection,
        "adt/references/findReferences",
        { destination, uri, position },
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
