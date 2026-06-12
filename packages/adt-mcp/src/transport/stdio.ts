/**
 * Stdio transport for the mesh (default).
 *
 * Uses `@openadt/mcp-framing` so it auto-detects Content-Length (Cursor IDE, MCP
 * spec) vs NDJSON (Cursor agent CLI) and replies on the same framing. Mirrors
 * the stdio loop in `@openadt/adt-lsp-mcp`.
 */
import {
  attachMcpStdoutEncoder,
  McpStdioDecoder,
  McpStdioEncoder,
  writeMcpStdioMessage,
} from '@openadt/mcp-framing'
import type { MeshMcpServer } from '../mesh-server.js'

export type StdioHandle = { closed: Promise<void> }

/** Pump stdin↔stdout through the mesh dispatcher. Resolves when stdin closes. */
export function serveStdio(server: MeshMcpServer): StdioHandle {
  const encoder = new McpStdioEncoder()
  const decoder = new McpStdioDecoder()
  attachMcpStdoutEncoder(encoder)

  decoder.on('transport', (mode) => {
    encoder.setTransport(mode)
  })
  decoder.on('error', (err: Error) => {
    console.error(`[openadt-mcp] stdio decode error: ${err.message}`)
  })
  decoder.on('data', (body: string) => {
    void onMessage(body)
  })

  async function onMessage(body: string): Promise<void> {
    let request: unknown
    try {
      request = JSON.parse(body)
    } catch {
      return
    }
    const response = await server.handle(request as never)
    if (response) {
      await writeMcpStdioMessage(encoder, response)
    }
  }

  const closed = new Promise<void>((resolve) => {
    process.stdin.on('end', resolve)
    process.stdin.on('close', resolve)
  })
  process.stdin.pipe(decoder)
  console.error('[openadt-mcp] mesh MCP server running on stdio')
  return { closed }
}
