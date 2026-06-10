/**
 * MCP tool contract for get external links.
 * MCP layer on top of ADT LSP filesystem service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { getExternalLinks } from "../../services/adtLs/fileSystem/getExternalLinks.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtGetExternalLinks = mcpTool({
  name: "adt_get_external_links",
  description: "Get external links for an object",
  types: {
    input: type<{ destination: string; uri: string }>(),
    output: type<{
      success: boolean;
      links: Array<{ name: string; url: string }>;
    }>(),
  },
});

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: { destination: string; uri: string }) {
      return await callLspContract(getExternalLinks, transport, params);
    },
  };
}
