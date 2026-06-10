import { describe, expect, test } from 'bun:test'
import { parseServeArgv, DEFAULT_WORKSPACE } from './config'
import { DEFAULT_MCP_PORT, DEFAULT_IMPORT_FROM } from './types'
import type { McpServeConfig } from './types'

describe('parseServeArgv', () => {
  test('returns default config with no arguments', () => {
    const result = parseServeArgv([])
    expect(result.port).toBe(DEFAULT_MCP_PORT)
    expect(result.workspace).toBe(DEFAULT_WORKSPACE)
    expect(result.importFrom).toBe(DEFAULT_IMPORT_FROM)
    expect(result.json).toBe(false)
    expect(result.verbose).toBe(false)
    expect(result.stdio).toBe(false)
    expect(result.proxyMode).toBe('proxy')
  })

  test('parses --port argument', () => {
    const result = parseServeArgv(['--port', '3000'])
    expect(result.port).toBe(3000)
    expect(result.explicitPort).toBe(true)
  })

  test('parses --port with equals sign', () => {
    const result = parseServeArgv(['--port=3000'])
    expect(result.port).toBe(3000)
    expect(result.explicitPort).toBe(true)
  })

  test('parses --workspace argument', () => {
    const result = parseServeArgv(['--workspace', '/custom/path'])
    expect(result.workspace).toBe('/custom/path')
    expect(result.explicitWorkspace).toBe(true)
  })

  test('parses --json flag', () => {
    const result = parseServeArgv(['--json'])
    expect(result.json).toBe(true)
  })

  test('parses --verbose flag', () => {
    const result = parseServeArgv(['--verbose'])
    expect(result.verbose).toBe(true)
  })

  test('parses --stdio flag', () => {
    const result = parseServeArgv(['--stdio'])
    expect(result.stdio).toBe(true)
  })

  test('parses --standalone flag', () => {
    const result = parseServeArgv(['--standalone'])
    expect(result.standalone).toBe(true)
  })

  test('parses --restart flag', () => {
    const result = parseServeArgv(['--restart'])
    expect(result.restart).toBe(true)
  })

  test('parses --proxy flag', () => {
    const result = parseServeArgv(['--proxy'])
    expect(result.proxyMode).toBe('proxy')
  })

  test('parses --no-proxy flag', () => {
    const result = parseServeArgv(['--no-proxy'])
    expect(result.proxyMode).toBe('no-proxy')
  })

  test('parses --destination argument', () => {
    const result = parseServeArgv(['--destination', 'MY_DEST'])
    expect(result.destination).toBe('MY_DEST')
  })

  test('throws error on unknown argument', () => {
    expect(() => parseServeArgv(['--unknown'])).toThrow('Unknown argument: --unknown')
  })

  test('parses multiple flags', () => {
    const result = parseServeArgv(['--json', '--verbose', '--stdio'])
    expect(result.json).toBe(true)
    expect(result.verbose).toBe(true)
    expect(result.stdio).toBe(true)
  })
})
