import { describe, expect, test } from 'bun:test'
import { z } from 'zod'
import { listMcpToolDescriptors, toMcpInputSchema } from './mcp-schema'

describe('mcp-schema', () => {
  test('toMcpInputSchema emits object properties', () => {
    const schema = z.object({
      foo: z.string().describe('A foo'),
      bar: z.number().optional(),
    })
    const json = toMcpInputSchema(schema) as { type?: string; properties?: Record<string, unknown> }
    expect(json.type).toBe('object')
    expect(json.properties?.foo).toBeDefined()
    expect(json.properties?.bar).toBeDefined()
  })

  test('toMcpInputSchema can omit server-bound fields from tools/list', () => {
    const schema = z.object({
      destination: z.string(),
      searchTerm: z.string(),
    })
    const json = toMcpInputSchema(schema, { omitFields: ['destination'] }) as {
      properties?: Record<string, unknown>
      required?: string[]
    }
    expect(json.properties?.destination).toBeUndefined()
    expect(json.properties?.searchTerm).toBeDefined()
    expect(json.required).toEqual(['searchTerm'])
  })

  test('listMcpToolDescriptors converts every tool schema', () => {
    const tools = [
      {
        name: 'a',
        description: 'A',
        inputSchema: z.object({ x: z.string() }),
      },
      {
        name: 'b',
        description: 'B',
        inputSchema: z.object({ y: z.number() }),
      },
    ]
    const listed = listMcpToolDescriptors(tools)
    expect(listed).toHaveLength(2)
    for (const tool of listed) {
      const schema = tool.inputSchema as { properties?: Record<string, unknown> }
      expect(Object.keys(schema.properties ?? {}).length).toBeGreaterThan(0)
    }
  })
})
