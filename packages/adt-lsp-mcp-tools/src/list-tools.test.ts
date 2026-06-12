import { describe, expect, test } from 'bun:test'
import { listMcpToolDescriptors } from './list-tools'
import { mcpTools } from './mcp-tools-array'

describe('listMcpToolDescriptors', () => {
  test('includes destination when server has no bound destination (SAP MCP mode)', () => {
    const tools = listMcpToolDescriptors()
    expect(tools).toHaveLength(mcpTools.length)
    const quickSearch = tools.find((t) => t.name === 'adt_quick_search')!
    const schema = quickSearch.inputSchema as {
      properties?: Record<string, unknown>
      required?: string[]
    }
    expect(schema.properties?.destination).toBeDefined()
    expect(schema.required).toContain('destination')
  })

  test('omits destination when server bound destination at startup', () => {
    const tools = listMcpToolDescriptors({ boundDestination: 'ABC_200_USER_EN' })
    const quickSearch = tools.find((t) => t.name === 'adt_quick_search')!
    const schema = quickSearch.inputSchema as {
      properties?: Record<string, unknown>
      required?: string[]
    }
    expect(schema.properties?.destination).toBeUndefined()
    expect(schema.required ?? []).not.toContain('destination')
  })

  test('every adt_* tool exposes JSON Schema properties for MCP Inspector', () => {
    const tools = listMcpToolDescriptors()
    const missing = tools.filter((t) => {
      const schema = t.inputSchema as {
        type?: string
        properties?: Record<string, unknown>
      }
      return (
        schema.type !== 'object' ||
        !schema.properties ||
        Object.keys(schema.properties).length === 0
      )
    })
    expect(missing.map((t) => t.name)).toEqual([])
  })
})
