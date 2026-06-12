import {
  listMcpToolDescriptors as listDescriptors,
  type McpToolDefinition,
} from '@openadt/mcp-tools'
import { mcpTools } from './mcp-tools-array'

export { toMcpInputSchema } from '@openadt/mcp-tools'

export type ListMcpToolDescriptorsOptions = {
  /** When set, destination is session-bound and omitted from tools/list (SAP MCP per-tool mode otherwise). */
  boundDestination?: string
}

export function listMcpToolDescriptors(options: ListMcpToolDescriptorsOptions = {}): Array<{
  name: string
  description: string
  inputSchema: Record<string, unknown>
}> {
  return listDescriptors(mcpTools as McpToolDefinition[], {
    omitFields: options.boundDestination ? ['destination'] : [],
  })
}
