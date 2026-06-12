/**
 * MCP tool factory — transport-agnostic handler surface.
 */
import { z } from 'zod'

export type ToolTransport = {
  sendRequest(
    method: string,
    params: unknown,
    paramStructure?: 'byName' | 'byPosition'
  ): Promise<unknown>
  sendNotification?(method: string, params: unknown): void
}

type ToolHandlerResult = {
  content: Array<{ type: string; text: string }>
  isError?: boolean
}

export function tool<
  T extends z.ZodRawShape,
  TTransport extends ToolTransport = ToolTransport,
>(def: {
  name: string
  description: string
  inputSchema: z.ZodObject<T>
  handler: (args: z.infer<z.ZodObject<T>>, transport: TTransport) => Promise<ToolHandlerResult>
}) {
  return def
}
