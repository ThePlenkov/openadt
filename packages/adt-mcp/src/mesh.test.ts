import { describe, expect, test } from 'bun:test'
import { parseServeArgv } from '@openadt/adt-config'
import { parseMcpHttpResponseBody } from './sap-mcp/client'
import { ToolNameRegistry } from './tool-name-limit'
import { augmentInstructions, getPrompt, listPrompts, GUIDANCE_INSTRUCTIONS } from './prompts'
import { deriveDestinationIds } from './destinations'
import { MeshMcpServer } from './mesh-server'
import type { SapSource } from './sap-mcp/source'

describe('parseMcpHttpResponseBody', () => {
  test('returns JSON body verbatim', () => {
    const out = parseMcpHttpResponseBody({
      contentType: 'application/json',
      body: '{"jsonrpc":"2.0","id":1,"result":{}}',
    })
    expect(out).toEqual(['{"jsonrpc":"2.0","id":1,"result":{}}'])
  })

  test('extracts SSE data lines, skipping [DONE]', () => {
    const body = ['event: message', 'data: {"id":1}', '', 'data: [DONE]'].join('\n')
    const out = parseMcpHttpResponseBody({ contentType: 'text/event-stream', body })
    expect(out).toEqual(['{"id":1}'])
  })

  test('empty body → no messages', () => {
    expect(parseMcpHttpResponseBody({ contentType: 'application/json', body: '  ' })).toEqual([])
  })
})

describe('ToolNameRegistry', () => {
  test('passes short names through unchanged', () => {
    const reg = new ToolNameRegistry(45)
    expect(reg.exportName('abap_activate_objects')).toBe('abap_activate_objects')
    expect(reg.importName('abap_activate_objects')).toBe('abap_activate_objects')
  })

  test('shortens long names and round-trips the alias', () => {
    const reg = new ToolNameRegistry(20)
    const long = 'abap_business_services-fetch_service_information'
    const alias = reg.exportName(long)
    expect(alias.length).toBeLessThanOrEqual(20)
    expect(alias).not.toBe(long)
    expect(reg.importName(alias)).toBe(long)
  })

  test('alias is stable across calls', () => {
    const reg = new ToolNameRegistry(20)
    const long = 'abap_business_services-fetch_service_information'
    expect(reg.exportName(long)).toBe(reg.exportName(long))
  })
})

describe('prompts', () => {
  test('lists the four guided workflows', () => {
    const names = listPrompts().map((p) => p.name)
    expect(names).toContain('create-abap-object')
    expect(names).toContain('generate-rap-service')
    expect(names).toContain('expose-odata-service')
    expect(names).toContain('activate-and-test')
  })

  test('renders placeholders and falls back to defaults for unset keys', () => {
    const result = getPrompt('create-abap-object', { destination: 'ABC_000_USER_EN' })
    const text = result?.messages[0]?.content.text ?? ''
    expect(text).toContain('ABC_000_USER_EN')
    expect(text).not.toContain('{{') // every placeholder resolved
    expect(text).toContain('the object') // unset {{name}} uses its default
  })

  test('unknown prompt → undefined', () => {
    expect(getPrompt('nope')).toBeUndefined()
  })

  test('augmentInstructions appends the cheat-sheet', () => {
    expect(augmentInstructions(undefined)).toBe(GUIDANCE_INSTRUCTIONS)
    expect(augmentInstructions('Backend says hi')).toContain('Backend says hi')
    expect(augmentInstructions('Backend says hi')).toContain('OpenADT ABAP workflow guide')
  })

  test('OPENADT_MCP_NO_GUIDANCE disables guidance', () => {
    const prev = process.env.OPENADT_MCP_NO_GUIDANCE
    process.env.OPENADT_MCP_NO_GUIDANCE = '1'
    try {
      expect(listPrompts()).toEqual([])
      expect(getPrompt('create-abap-object')).toBeUndefined()
      expect(augmentInstructions('x')).toBe('x')
    } finally {
      if (prev === undefined) delete process.env.OPENADT_MCP_NO_GUIDANCE
      else process.env.OPENADT_MCP_NO_GUIDANCE = prev
    }
  })
})

describe('deriveDestinationIds', () => {
  test('extracts, trims, de-dupes and sorts ids', () => {
    const ids = deriveDestinationIds({
      destinations: [{ id: 'B_2' }, { id: ' A_1 ' }, { id: 'A_1' }, { id: '' }],
    })
    expect(ids).toEqual(['A_1', 'B_2'])
  })

  test('empty store → empty', () => {
    expect(deriveDestinationIds({})).toEqual([])
    expect(deriveDestinationIds({ destinations: [] })).toEqual([])
  })
})

describe('MeshMcpServer', () => {
  const baseCfg = parseServeArgv([])

  function fakeSource(overrides: Partial<SapSource> = {}): SapSource {
    return {
      client: {
        listTools: async () => [],
        callTool: async (name: string, args: unknown) => ({ called: name, args }),
        initialize: async () => {},
      } as never,
      session: null,
      port: 2236,
      token: 'tok',
      ownsChild: true,
      shutdown: async () => {},
      ...overrides,
    }
  }

  test('notifications return null', async () => {
    const server = new MeshMcpServer({ cfg: baseCfg, source: fakeSource(), sapTools: [] })
    expect(await server.handle({ method: 'notifications/initialized' })).toBeNull()
  })

  test('initialize advertises tools + prompts', async () => {
    const server = new MeshMcpServer({ cfg: baseCfg, source: fakeSource(), sapTools: [] })
    const res = await server.handle({ id: 1, method: 'initialize' })
    const result = res?.result as { serverInfo?: { name?: string }; capabilities?: unknown }
    expect(result.serverInfo?.name).toBe('openadt-mcp')
    expect(result.capabilities).toEqual({ tools: {}, prompts: {} })
  })

  test('listTools merges SAP group, shortening long names', () => {
    process.env.OPENADT_MCP_MAX_TOOL_NAME = '20'
    try {
      const server = new MeshMcpServer({
        cfg: { ...baseCfg, lsp: false },
        source: fakeSource({ session: null }),
        sapTools: [
          { name: 'abap_short', description: 's' },
          { name: 'abap_business_services-fetch_service_information', description: 'l' },
        ],
      })
      const names = server.listTools().map((t) => t.name)
      expect(names).toContain('abap_short')
      expect(names.every((n) => n.length <= 20)).toBe(true)
    } finally {
      delete process.env.OPENADT_MCP_MAX_TOOL_NAME
    }
  })

  test('listTools adds adt_* group when lsp active (session present)', () => {
    const server = new MeshMcpServer({
      cfg: { ...baseCfg, lsp: true },
      source: fakeSource({ session: {} as never }),
      sapTools: [{ name: 'abap_x' }],
    })
    const names = server.listTools().map((t) => t.name)
    expect(names).toContain('abap_x')
    expect(names.some((n) => n.startsWith('adt_'))).toBe(true)
  })

  test('tools/call routes a SAP tool to the HTTP client', async () => {
    const server = new MeshMcpServer({
      cfg: { ...baseCfg, lsp: false },
      source: fakeSource({ session: null }),
      sapTools: [{ name: 'abap_x' }],
    })
    const res = await server.handle({
      id: 7,
      method: 'tools/call',
      params: { name: 'abap_x', arguments: { a: 1 } },
    })
    expect(res?.result).toEqual({ called: 'abap_x', args: { a: 1 } })
  })

  test('unknown method → JSON-RPC error', async () => {
    const server = new MeshMcpServer({ cfg: baseCfg, source: fakeSource(), sapTools: [] })
    const res = await server.handle({ id: 9, method: 'no/such' })
    expect(res?.error?.code).toBe(-32603)
  })
})
