import { describe, expect, test, mock, afterEach } from 'bun:test'
// @ts-ignore - workspace package without types yet
import { mcpTools } from '@openadt/adt-mcp-tools'

describe('ADT LSP MCP Server', () => {
  test('mcpTools exports all 26 ADT tools', () => {
    expect(mcpTools.length).toBe(26)
    const toolNames = mcpTools.map((t: { name: string }) => t.name)
    expect(toolNames).toContain('adt_quick_search')
    expect(toolNames).toContain('adt_check_transport_lock')
    expect(toolNames).toContain('adt_create_transport')
    expect(toolNames).toContain('adt_assign_transport')
  })

  test('each tool has required MCP schema', () => {
    for (const tool of mcpTools) {
      expect(tool.name).toBeTruthy()
      expect(tool.description).toBeTruthy()
      expect(tool.inputSchema).toBeTruthy()
      expect(tool.handler).toBeInstanceOf(Function)
    }
  })

  test('tool names follow adt_ prefix convention', () => {
    for (const tool of mcpTools) {
      expect(tool.name).toMatch(/^adt_/)
    }
  })
})
