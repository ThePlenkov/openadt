import { z } from 'zod'

export type McpToolDefinition = {
  name: string
  description: string
  inputSchema: z.ZodObject<z.ZodRawShape>
}

export type McpInputSchemaOptions = {
  /** Fields bound at MCP server startup — omitted from tools/list for clients. */
  omitFields?: string[]
}

function omitListedFields(
  schema: Record<string, unknown>,
  omitFields: string[]
): Record<string, unknown> {
  if (omitFields.length === 0) {
    return schema
  }
  const copy = structuredClone(schema)
  const properties = copy.properties
  if (properties && typeof properties === 'object') {
    for (const field of omitFields) {
      delete (properties as Record<string, unknown>)[field]
    }
  }
  if (Array.isArray(copy.required)) {
    copy.required = copy.required.filter((field) => !omitFields.includes(String(field)))
  }
  return copy
}

/** MCP tools/list `inputSchema` must be JSON Schema — not a Zod object. */
export function toMcpInputSchema(
  schema: z.ZodObject<z.ZodRawShape>,
  options: McpInputSchemaOptions = {}
): Record<string, unknown> {
  const json = z.toJSONSchema(schema) as Record<string, unknown>
  return omitListedFields(json, options.omitFields ?? [])
}

export function listMcpToolDescriptors(
  tools: McpToolDefinition[],
  options: McpInputSchemaOptions = {}
): Array<{
  name: string
  description: string
  inputSchema: Record<string, unknown>
}> {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: toMcpInputSchema(t.inputSchema, options),
  }))
}
