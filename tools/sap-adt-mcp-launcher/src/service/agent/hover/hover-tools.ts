/**
 * Hover information tool.
 * Calls LSP method from AbapLsHoverService.
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
 * Hover tool set for agent registry.
 */
export class HoverToolSet implements AgentToolSet {
  register(registry: AgentRegistry): void {
    registry.register({
      name: "adt_get_hover",
      description: "Get documentation for a code element at a position",
      inputSchema: {
        type: "object",
        properties: {
          destination: { type: "string", description: "SAP destination" },
          uri: { type: "string", description: "ADT URI of the document" },
          position: {
            type: "object",
            properties: {
              line: { type: "number", description: "Line number (0-based)" },
              character: {
                type: "number",
                description: "Character position (0-based)",
              },
            },
            required: ["line", "character"],
          },
        },
        required: ["destination", "uri", "position"],
      },
      handle: async (args, ctx) => this.handleGetHover(args, ctx),
    });
  }

  private async handleGetHover(
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
    if (typeof pos.line !== "number" || pos.line < 0) {
      return {
        success: false,
        error: agentError(
          AgentErrorCode.INVALID_URI,
          "position.line must be a non-negative number",
          String(pos.line),
        ),
      };
    }

    if (typeof pos.character !== "number" || pos.character < 0) {
      return {
        success: false,
        error: agentError(
          AgentErrorCode.INVALID_URI,
          "position.character must be a non-negative number",
          String(pos.character),
        ),
      };
    }

    try {
      const result = await callLspMethod<{
        success: boolean;
        documentation: string; // Markdown formatted
      }>(
        ctx.lspConnection,
        "adt/hover/getHover",
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
