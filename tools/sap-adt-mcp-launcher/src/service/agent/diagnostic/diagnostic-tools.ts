/**
 * Diagnostics tool.
 * Calls LSP method from AdtLsDiagnosticService.
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
 * Diagnostics tool set for agent registry.
 */
export class DiagnosticToolSet implements AgentToolSet {
  private throttle = new AgentThrottle(4, 1000);

  register(registry: AgentRegistry): void {
    registry.register({
      name: "adt_get_diagnostics",
      description: "Get syntax and check errors for an ABAP object",
      inputSchema: {
        type: "object",
        properties: {
          destination: { type: "string", description: "SAP destination" },
          uri: { type: "string", description: "ADT URI of the object" },
        },
        required: ["destination", "uri"],
      },
      handle: async (args, ctx) => this.handleGetDiagnostics(args, ctx),
    });
  }

  private async handleGetDiagnostics(
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

    // Throttle to prevent server overload
    await this.throttle.acquire(destination);

    try {
      const result = await callLspMethod<{
        success: boolean;
        diagnostics: Array<{
          severity: "error" | "warning" | "info";
          message: string;
          range: {
            start: { line: number; character: number };
            end: { line: number; character: number };
          };
        }>;
      }>(
        ctx.lspConnection,
        "adt/diagnostic/diagnostic",
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
