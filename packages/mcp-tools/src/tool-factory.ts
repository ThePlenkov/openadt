/**
 * MCP tool factory function.
 * Ensures exports are valid MCP tools with proper typing.
 */
import { z } from 'zod'
import type { LspTransport } from '@openadt/lsp-client'

/**
 * MCP tool definition (internal type)
 */
type ToolDefinition<T extends z.ZodRawShape> = {
  name: string
  description: string
  inputSchema: z.ZodObject<T>
  handler: (
    args: z.infer<z.ZodObject<T>>,
    transport: LspTransport
  ) => Promise<{
    content: Array<{ type: string; text: string }>
    isError?: boolean
  }>
}

/**
 * MCP tool factory function.
 * Validates and creates a properly typed MCP tool.
 */
export function tool<T extends z.ZodRawShape>(def: {
  name: string
  description: string
  inputSchema: z.ZodObject<T>
  handler: (
    args: z.infer<z.ZodObject<T>>,
    transport: LspTransport
  ) => Promise<{
    content: Array<{ type: string; text: string }>
    isError?: boolean
  }>
}): ToolDefinition<T> {
  return def
}
