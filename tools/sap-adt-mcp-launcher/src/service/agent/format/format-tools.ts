/**
 * Code formatting tool.
 * Calls LSP method from AbapLsFormatService.
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
 * Format tool set for agent registry.
 */
export class FormatToolSet implements AgentToolSet {
  private throttle = new AgentThrottle(4, 1000); // 4 requests per second

  register(registry: AgentRegistry): void {
    registry.register({
      name: "adt_format_code",
      description: "Format ABAP code according to pretty printer rules",
      inputSchema: {
        type: "object",
        properties: {
          destination: { type: "string", description: "SAP destination" },
          uri: { type: "string", description: "ADT URI of the object" },
          content: { type: "string", description: "Source code to format" },
        },
        required: ["destination", "uri", "content"],
      },
      handle: async (args, ctx) => this.handleFormatCode(args, ctx),
    });
  }

  private async handleFormatCode(
    args: Record<string, unknown>,
    ctx: AgentContext,
  ): Promise<AgentResult> {
    const { destination, uri, content } = args;

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

    if (typeof content !== "string") {
      return {
        success: false,
        error: agentError(
          AgentErrorCode.INVALID_URI,
          "content must be a string",
          String(content),
        ),
      };
    }

    parseAdtUri(uri); // Validate URI format

    // Throttle to prevent server overload
    await this.throttle.acquire(destination);

    try {
      const result = await callLspMethod<{
        success: boolean;
        formattedContent: string;
      }>(
        ctx.lspConnection,
        "adt/format/formatting",
        { destination, uri, content },
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
