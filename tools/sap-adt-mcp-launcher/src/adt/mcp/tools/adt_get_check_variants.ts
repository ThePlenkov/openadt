/**
 * MCP tool contract for get check variants.
 * MCP layer on top of ADT LSP ATC service.
 */
import { mcpTool, type } from "../../../mcp/contract/contract-core.js";
import { getCheckVariants } from "../../services/adtLs/atc/getCheckVariants.js";
import type { LspTransport } from "../../../lsp/client/lsp-transport.js";
import { callLspContract } from "../../../lsp/client/call-lsp-contract.js";

export const adtGetCheckVariants = mcpTool({
  name: "adt_get_check_variants",
  description: "Get ATC check variants",
  types: {
    input: type<{ destination: string }>(),
    output: type<string[]>(),
  },
});

export function createHandler(transport: LspTransport) {
  return {
    async handle(params: { destination: string }) {
      return await callLspContract(getCheckVariants, transport, params);
    },
  };
}
