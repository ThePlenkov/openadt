/**
 * SAP ADT HTTP MCP client.
 *
 * Speaks the real Streamable-HTTP MCP protocol to the SAP server embedded in
 * `adt-lsc` (`POST /mcp`, Bearer auth, `Mcp-Session-Id` header, JSON *or* SSE
 * response bodies). Replaces the placeholder REST client. The mesh server uses
 * this to enumerate `abap_*` tools and forward `tools/call` for that group.
 */
import { mcpUrl } from './control.js'

export interface McpTool {
  name: string
  description?: string
  inputSchema?: unknown
}

interface JsonRpcResponse {
  jsonrpc?: string
  id?: number | string | null
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

/** One MCP HTTP endpoint: URL + bearer token + optional streamable session id. */
export class McpHttpEndpoint {
  static forConfig(port: number, token: string, sessionId?: string): McpHttpEndpoint {
    return new McpHttpEndpoint(mcpUrl(port), token, sessionId)
  }
  constructor(
    readonly url: string,
    readonly token: string,
    readonly sessionId: string | undefined
  ) {}
  withSessionId(sessionId: string | undefined): McpHttpEndpoint {
    return new McpHttpEndpoint(this.url, this.token, sessionId)
  }
}

export interface McpHttpPostResult {
  messages: string[]
  sessionId: string | undefined
  status: number
}

/** Parse an MCP HTTP response body (JSON object/array or SSE `data:` lines). */
export function parseMcpHttpResponseBody(input: { contentType: string; body: string }): string[] {
  const trimmed = input.body.trim()
  if (!trimmed) {
    return []
  }
  if (input.contentType.includes('text/event-stream')) {
    return parseSseMessages(trimmed)
  }
  return [trimmed]
}

function parseSseMessages(body: string): string[] {
  const messages: string[] = []
  for (const line of body.split(/\r?\n/)) {
    if (!line.startsWith('data:')) {
      continue
    }
    const payload = line.slice(5).trimStart()
    if (payload && payload !== '[DONE]') {
      messages.push(payload)
    }
  }
  return messages
}

/** POST one JSON-RPC message to the HTTP MCP endpoint; capture the session id. */
export async function postMcpHttpMessage(
  endpoint: McpHttpEndpoint,
  body: string,
  options: { timeoutMs?: number } = {}
): Promise<McpHttpPostResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    'User-Agent': 'openadt-mcp-client',
    Authorization: `Bearer ${endpoint.token}`,
  }
  if (endpoint.sessionId) {
    headers['Mcp-Session-Id'] = endpoint.sessionId
  }
  const res = await fetch(endpoint.url, {
    method: 'POST',
    headers,
    body,
    signal: AbortSignal.timeout(options.timeoutMs ?? 60_000),
  })
  const nextSessionId = res.headers.get('Mcp-Session-Id') ?? endpoint.sessionId ?? undefined
  const text = await res.text()
  const contentType = res.headers.get('content-type') ?? ''
  return {
    messages: parseMcpHttpResponseBody({ contentType, body: text }),
    sessionId: nextSessionId,
    status: res.status,
  }
}

/**
 * Stateful client to a SAP HTTP MCP server. Performs the MCP `initialize`
 * handshake once (capturing the session id) and then proxies `tools/list` /
 * `tools/call` for the SAP tool group.
 */
export class SapHttpMcpClient {
  private endpoint: McpHttpEndpoint
  private nextId = 1
  private initialized = false

  constructor(port: number, token: string) {
    this.endpoint = McpHttpEndpoint.forConfig(port, token)
  }

  /** MCP `initialize` + `notifications/initialized`; captures the session id. */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }
    const id = this.nextId++
    const res = await this.post(
      JSON.stringify({
        jsonrpc: '2.0',
        id,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'openadt-mcp', version: '0.1.0' },
        },
      })
    )
    this.expectResult(res, id, 'initialize')
    // Notification: no id, no response expected.
    await this.post(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }))
    this.initialized = true
  }

  /** Enumerate the SAP `abap_*` tools. */
  async listTools(): Promise<McpTool[]> {
    await this.initialize()
    const id = this.nextId++
    const res = await this.post(
      JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/list', params: {} })
    )
    const result = this.expectResult(res, id, 'tools/list') as { tools?: McpTool[] }
    return result.tools ?? []
  }

  /** Forward a `tools/call` to the SAP server; returns the JSON-RPC `result`. */
  async callTool(name: string, args: unknown): Promise<unknown> {
    await this.initialize()
    const id = this.nextId++
    const res = await this.post(
      JSON.stringify({
        jsonrpc: '2.0',
        id,
        method: 'tools/call',
        params: { name, arguments: args ?? {} },
      })
    )
    return this.expectResult(res, id, `tools/call ${name}`)
  }

  private async post(body: string): Promise<McpHttpPostResult> {
    const res = await postMcpHttpMessage(this.endpoint, body)
    if (res.sessionId && res.sessionId !== this.endpoint.sessionId) {
      this.endpoint = this.endpoint.withSessionId(res.sessionId)
    }
    return res
  }

  private expectResult(res: McpHttpPostResult, id: number, label: string): unknown {
    if (res.status >= 400) {
      throw new Error(`SAP MCP ${label} failed: HTTP ${res.status}`)
    }
    for (const raw of res.messages) {
      let parsed: JsonRpcResponse
      try {
        parsed = JSON.parse(raw) as JsonRpcResponse
      } catch {
        continue
      }
      if (parsed.id !== id) {
        continue
      }
      if (parsed.error) {
        throw new Error(`SAP MCP ${label} error ${parsed.error.code}: ${parsed.error.message}`)
      }
      return parsed.result ?? {}
    }
    throw new Error(`SAP MCP ${label}: no matching JSON-RPC response (id ${id})`)
  }
}
