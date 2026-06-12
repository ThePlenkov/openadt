/**
 * In-process `adt_*` LSP tool group.
 *
 * Reuses the owned LSP session's `connection` (via `LspConnectionTransport`) to
 * run the 26 OpenADT `adt_*` tools — the same handlers the standalone
 * `@openadt/adt-lsp-mcp` binary uses. Per-tool destination mode (unbound), so
 * each tool exposes a required `destination` argument, matching SAP MCP parity.
 */
import { listMcpToolDescriptors, mcpTools } from '@openadt/adt-lsp-mcp-tools'
import { LspConnectionTransport, type LspSession } from '@openadt/adt-lsp-client'

export type ToolDescriptor = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

/** `adt_*` tool descriptors for `tools/list` (per-tool destination mode). */
export function listLspToolDescriptors(): ToolDescriptor[] {
  return listMcpToolDescriptors()
}

export function isLspToolName(name: string): boolean {
  return mcpTools.some((t) => t.name === name)
}

/** Run one `adt_*` tool over the owned LSP connection. Returns the MCP result. */
export async function callLspTool(
  session: LspSession,
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const tool = mcpTools.find((t) => t.name === name)
  if (!tool) {
    throw new Error(`Unknown LSP tool: ${name}`)
  }
  const transport = new LspConnectionTransport(session.connection)
  return tool.handler(args as never, transport)
}
