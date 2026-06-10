/**
 * ATC (ABAP Test Cockpit) tools.
 * Calls LSP methods from AdtLsAtcExtension.
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
 * ATC tool set for agent registry.
 */
export class AtcToolSet implements AgentToolSet {
  register(registry: AgentRegistry): void {
    registry.register({
      name: "adt_atc_get_variants",
      description: "Get available ATC check variants for a destination",
      inputSchema: {
        type: "object",
        properties: {
          destination: { type: "string", description: "SAP destination" },
        },
        required: ["destination"],
      },
      handle: async (args, ctx) => this.handleGetVariants(args, ctx),
    });

    registry.register({
      name: "adt_atc_run_check",
      description: "Run ATC check on one or more ABAP objects",
      inputSchema: {
        type: "object",
        properties: {
          destination: { type: "string", description: "SAP destination" },
          uris: {
            type: "array",
            items: { type: "string" },
            description: "List of ADT URIs to check",
          },
          variant: { type: "string", description: "ATC check variant name" },
        },
        required: ["destination", "uris"],
      },
      handle: async (args, ctx) => this.handleRunCheck(args, ctx),
    });
  }

  private async handleGetVariants(
    args: Record<string, unknown>,
    ctx: AgentContext,
  ): Promise<AgentResult> {
    const { destination } = args;

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

    try {
      const variants = await callLspMethod<string[]>(
        ctx.lspConnection,
        "adt/atc/getCheckVariants",
        { destination },
        { log: ctx.log },
      );

      return {
        success: true,
        data: { variants },
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

  private async handleRunCheck(
    args: Record<string, unknown>,
    ctx: AgentContext,
  ): Promise<AgentResult> {
    const { destination, uris, variant } = args;

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

    if (!Array.isArray(uris)) {
      return {
        success: false,
        error: agentError(
          AgentErrorCode.INVALID_URI,
          "uris must be an array",
          String(uris),
        ),
      };
    }

    // Validate URIs
    for (const uri of uris) {
      if (typeof uri !== "string") {
        return {
          success: false,
          error: agentError(
            AgentErrorCode.INVALID_URI,
            "each uri must be a string",
            String(uri),
          ),
        };
      }
      parseAdtUri(uri); // Validate URI format
    }

    try {
      const result = await callLspMethod<{
        success: boolean;
        findings: unknown[];
      }>(
        ctx.lspConnection,
        "adt/atc/runCheck",
        {
          destination,
          uris,
          variant: variant ?? "DEFAULT",
        },
        { log: ctx.log, timeoutMs: 120000 }, // ATC checks can take longer
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
