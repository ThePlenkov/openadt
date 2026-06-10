/**
 * Version toggle tool.
 * Calls LSP method from AdtLsFileSystemExtension.
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
 * Version tool set for agent registry.
 */
export class VersionToolSet implements AgentToolSet {
  register(registry: AgentRegistry): void {
    registry.register({
      name: "adt_toggle_version",
      description:
        "Toggle between active and inactive version of an ABAP object",
      inputSchema: {
        type: "object",
        properties: {
          destination: { type: "string", description: "SAP destination" },
          uri: { type: "string", description: "ADT URI of the object" },
        },
        required: ["destination", "uri"],
      },
      handle: async (args, ctx) => this.handleToggleVersion(args, ctx),
    });
  }

  private async handleToggleVersion(
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
        isActive: boolean;
      }>(
        ctx.lspConnection,
        "adt/fileSystem/toggleVersion",
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
