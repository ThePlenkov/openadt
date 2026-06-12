/**
 * HTTP transport for the mesh (`serve --http`).
 *
 * Exposes the merged MCP surface at `POST /mcp` with Bearer auth on localhost,
 * the same client contract as the SAP server. JSON request/response (no SSE);
 * sufficient for HTTP-native MCP clients. Built on `node:http` to avoid a
 * runtime-specific server dependency.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { MeshMcpServer } from '../mesh-server.js'

export type HttpServeOptions = {
  port: number
  token: string
  host?: string
}

export type HttpHandle = {
  server: Server
  close: () => Promise<void>
}

/** Start the mesh HTTP server. Rejects if the port cannot be bound. */
export function serveHttp(server: MeshMcpServer, options: HttpServeOptions): Promise<HttpHandle> {
  const host = options.host ?? '127.0.0.1'
  const httpServer = createServer((req, res) => {
    void handleRequest({ req, res, server, token: options.token })
  })

  return new Promise<HttpHandle>((resolve, reject) => {
    httpServer.once('error', reject)
    httpServer.listen(options.port, host, () => {
      httpServer.removeListener('error', reject)
      console.error(`[openadt-mcp] mesh MCP server running on http://${host}:${options.port}/mcp`)
      resolve({
        server: httpServer,
        close: () =>
          new Promise<void>((done) => {
            httpServer.close(() => done())
          }),
      })
    })
  })
}

async function handleRequest(ctx: {
  req: IncomingMessage
  res: ServerResponse
  server: MeshMcpServer
  token: string
}): Promise<void> {
  const { req, res, server, token } = ctx
  const url = req.url ?? ''
  if (req.method !== 'POST' || !url.startsWith('/mcp')) {
    sendJson(res, 404, { error: 'not found' })
    return
  }
  if (!isAuthorized(req, token)) {
    res.setHeader('WWW-Authenticate', 'Bearer')
    sendJson(res, 401, { error: 'unauthorized' })
    return
  }
  let body: string
  try {
    body = await readBody(req)
  } catch {
    sendJson(res, 400, { error: 'bad request' })
    return
  }
  let request: unknown
  try {
    request = JSON.parse(body)
  } catch {
    sendJson(res, 400, jsonRpcError(null, -32700, 'Parse error'))
    return
  }
  const response = await server.handle(request as never)
  // Notifications get a 202 with no body.
  if (!response) {
    res.statusCode = 202
    res.end()
    return
  }
  sendJson(res, 200, response)
}

function isAuthorized(req: IncomingMessage, token: string): boolean {
  const header = req.headers.authorization ?? ''
  return header === `Bearer ${token}`
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(body)
}

function jsonRpcError(id: number | string | null, code: number, message: string): object {
  return { jsonrpc: '2.0', id, error: { code, message } }
}
