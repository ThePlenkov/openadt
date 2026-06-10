import { describe, expect, test } from 'bun:test'
import { detectMcpStdioTransport, frameMcpMessage, type McpStdioTransport } from './mcp-framing'

describe('detectMcpStdioTransport', () => {
  test('detects NDJSON transport for JSON object', () => {
    const chunk = Buffer.from('{"jsonrpc":"2.0","method":"initialize"}')
    const result = detectMcpStdioTransport(chunk)
    expect(result).toBe('ndjson')
  })

  test('detects Content-Length transport for Content-Length header', () => {
    const chunk = Buffer.from('Content-Length: 123\r\n\r\n')
    const result = detectMcpStdioTransport(chunk)
    expect(result).toBe('content-length')
  })

  test('detects Content-Length transport case-insensitive', () => {
    const chunk = Buffer.from('CONTENT-LENGTH: 123\r\n\r\n')
    const result = detectMcpStdioTransport(chunk)
    expect(result).toBe('content-length')
  })

  test('handles leading whitespace', () => {
    const chunk = Buffer.from('  {"jsonrpc":"2.0"}')
    const result = detectMcpStdioTransport(chunk)
    expect(result).toBe('ndjson')
  })

  test('defaults to content-length for unknown format', () => {
    const chunk = Buffer.from('random text')
    const result = detectMcpStdioTransport(chunk)
    expect(result).toBe('content-length')
  })
})

describe('frameMcpMessage', () => {
  test('frames object message with Content-Length header', () => {
    const msg = { jsonrpc: '2.0', method: 'initialize' }
    const result = frameMcpMessage(msg)
    const str = result.toString('utf8')
    expect(str).toContain('Content-Length:')
    expect(str).toContain('\r\n\r\n')
    expect(str).toContain('{"jsonrpc":"2.0","method":"initialize"}')
  })

  test('frames string message with Content-Length header', () => {
    const msg = 'test message'
    const result = frameMcpMessage(msg)
    const str = result.toString('utf8')
    expect(str).toContain('Content-Length:')
    expect(str).toContain('\r\n\r\n')
    expect(str).toContain('test message')
  })

  test('calculates correct Content-Length', () => {
    const msg = 'hello'
    const result = frameMcpMessage(msg)
    const str = result.toString('utf8')
    const match = str.match(/Content-Length:\s*(\d+)/)
    expect(match).toBeTruthy()
    const length = Number(match?.[1])
    expect(length).toBe(5) // "hello" is 5 bytes
  })

  test('handles unicode characters correctly', () => {
    const msg = 'hello 世界'
    const result = frameMcpMessage(msg)
    const str = result.toString('utf8')
    const match = str.match(/Content-Length:\s*(\d+)/)
    expect(match).toBeTruthy()
    const length = Number(match?.[1])
    expect(length).toBe(12) // "hello 世界" is 12 bytes in UTF-8
  })
})
