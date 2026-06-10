/**
 * Application run tool.
 * Calls LSP method from AdtLsApplicationRunExtension.
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
 * Run tool set for agent registry.
 */
export class RunToolSet implements AgentToolSet {
  register(registry: AgentRegistry): void {
    registry.register({
      name: "adt_run_application",
      description: "Run an ABAP application in console mode",
      inputSchema: {
        type: "object",
        properties: {
          destination: { type: "string", description: "SAP destination" },
          uri: {
            type: "string",
            description: "ADT URI of the application (class or program)",
          },
        },
        required: ["destination", "uri"],
      },
      handle: async (args, ctx) => this.handleRunApplication(args, ctx),
    });
  }

  private async handleRunApplication(
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
        success: boolean;
        output: string;
        exitCode?: number;
      }>(
        ctx.lspConnection,
        "adt/applicationRun/runApplication",
        { destination, uri },
        { log: ctx.log, timeoutMs: 120000 }, // Apps can take longer
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
