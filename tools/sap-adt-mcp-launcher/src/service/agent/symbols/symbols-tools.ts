/**
 * Document symbols tool.
 * Calls LSP method from AbapLsDocumentSymbolService.
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
 * Symbols tool set for agent registry.
 */
export class SymbolsToolSet implements AgentToolSet {
  register(registry: AgentRegistry): void {
    registry.register({
      name: "adt_document_symbols",
      description: "Get document structure/outline for an ABAP object",
      inputSchema: {
        type: "object",
        properties: {
          destination: { type: "string", description: "SAP destination" },
          uri: { type: "string", description: "ADT URI of the document" },
        },
        required: ["destination", "uri"],
      },
      handle: async (args, ctx) => this.handleDocumentSymbols(args, ctx),
    });
  }

  private async handleDocumentSymbols(
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
        symbols: Array<{
          name: string;
          kind: string;
          detail?: string;
          range: {
            start: { line: number; character: number };
            end: { line: number; character: number };
          };
          children?: unknown[];
        }>;
      }>(
        ctx.lspConnection,
        "adt/documentSymbol/documentSymbols",
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
