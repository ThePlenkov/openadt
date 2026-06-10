/**
 * Repository search tool.
 * Calls LSP method from AdtLsRepositoryExtension.
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
 * Repository tool set for agent registry.
 */
export class RepositoryToolSet implements AgentToolSet {
  register(registry: AgentRegistry): void {
    registry.register({
      name: "adt_quick_search",
      description: "Quick search in the ABAP repository",
      inputSchema: {
        type: "object",
        properties: {
          destination: { type: "string", description: "SAP destination" },
          searchTerm: {
            type: "string",
            description: "Search term (e.g., 'Z*', 'CLAS*')",
          },
          objectType: {
            type: "string",
            description: "Object type filter (e.g., 'CLAS', 'PROG')",
          },
          package: { type: "string", description: "Package filter" },
          maxResults: {
            type: "number",
            description: "Maximum results (default: 50)",
          },
        },
        required: ["destination", "searchTerm"],
      },
      handle: async (args, ctx) => this.handleQuickSearch(args, ctx),
    });
  }

  private async handleQuickSearch(
    args: Record<string, unknown>,
    ctx: AgentContext,
  ): Promise<AgentResult> {
    const {
      destination,
      searchTerm,
      objectType,
      package: pkg,
      maxResults,
    } = args;

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

    if (typeof searchTerm !== "string") {
      return {
        success: false,
        error: agentError(
          AgentErrorCode.INVALID_URI,
          "searchTerm must be a string",
          String(searchTerm),
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

    if (maxResults !== undefined) {
      if (
        typeof maxResults !== "number" ||
        maxResults < 1 ||
        maxResults > 1000
      ) {
        return {
          success: false,
          error: agentError(
            AgentErrorCode.INVALID_URI,
            "maxResults must be a number between 1 and 1000",
            String(maxResults),
          ),
        };
      }
    }

    try {
      const result = await callLspMethod<{
        success: boolean;
        results: Array<{
          name: string;
          type: string;
          uri: string;
          package?: string;
        }>;
      }>(
        ctx.lspConnection,
        "adt/repository/quickSearch",
        {
          destination,
          searchTerm,
          objectType,
          package: pkg,
          maxResults: maxResults ?? 50,
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
