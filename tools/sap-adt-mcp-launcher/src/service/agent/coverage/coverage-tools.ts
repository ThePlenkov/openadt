/**
 * Code coverage tools.
 * Calls LSP methods from AdtCoverageExtension.
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
 * Coverage tool set for agent registry.
 */
export class CoverageToolSet implements AgentToolSet {
  register(registry: AgentRegistry): void {
    registry.register({
      name: "adt_get_coverage",
      description: "Get code coverage data for an ABAP object",
      inputSchema: {
        type: "object",
        properties: {
          destination: { type: "string", description: "SAP destination" },
          uri: { type: "string", description: "ADT URI of the object" },
        },
        required: ["destination", "uri"],
      },
      handle: async (args, ctx) => this.handleGetCoverage(args, ctx),
    });

    registry.register({
      name: "adt_load_statement_coverage",
      description: "Load statement-level coverage data",
      inputSchema: {
        type: "object",
        properties: {
          destination: { type: "string", description: "SAP destination" },
          uri: { type: "string", description: "ADT URI of the object" },
        },
        required: ["destination", "uri"],
      },
      handle: async (args, ctx) => this.handleLoadStatementCoverage(args, ctx),
    });
  }

  private async handleGetCoverage(
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
        coverage: {
          percentage: number;
          coveredLines: number;
          totalLines: number;
          branches?: Array<{ line: number; covered: boolean }>;
        };
      }>(
        ctx.lspConnection,
        "adt/coverage/getCoverage",
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

  private async handleLoadStatementCoverage(
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
        statements: Array<{
          line: number;
          covered: boolean;
          executions?: number;
        }>;
      }>(
        ctx.lspConnection,
        "adt/coverage/loadStatementResults",
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
