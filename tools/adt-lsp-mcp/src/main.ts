#!/usr/bin/env bun
/**
 * ADT LSP MCP Server - stdio-only MCP server for 26 OpenADT tools
 *
 * This is a focused MCP server that exposes only the LSP-based tools (adt_*)
 * that connect to the adt-lsc language server via stdio.
 *
 * Usage: bun src/main.ts serve --stdio --destination <DEST> --import-from adtls
 */
import { mcpTools } from '@openadt/adt-mcp-tools'
import {
  attachMcpStdoutEncoder,
  McpStdioDecoder,
  McpStdioEncoder,
  writeMcpStdioMessage,
} from '@openadt/mcp-framing'

// Simple MCP server implementation (stdio-only, no HTTP)
class SimpleMcpServer {
  private encoder = new McpStdioEncoder()
  private decoder = new McpStdioDecoder()
  private pending = new Map<number | string, (result: unknown) => void>()
  private nextId = 1

  constructor() {
    attachMcpStdoutEncoder(this.encoder)
    this.decoder.on('data', (body: string) => this.onMessage(body))
    this.decoder.pipe(process.stdin)
  }

  private onMessage(body: string): void {
    try {
      const parsed = JSON.parse(body) as {
        id?: number | string
        method?: string
        params?: unknown
      }
      if (!parsed.id) return // notification, ignore
      if (parsed.method === 'tools/list') {
        this.respond(parsed.id, {
          tools: mcpTools.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
          })),
        })
      } else if (parsed.method === 'tools/call' && parsed.params) {
        const params = parsed.params as {
          name?: string
          arguments?: Record<string, unknown>
        }
        if (params.name) {
          this.handleToolCall(parsed.id, params.name, params.arguments ?? {})
        }
      }
    } catch (err) {
      console.error('MCP message error:', err)
    }
  }

  private async handleToolCall(
    id: number | string,
    name: string,
    args: Record<string, unknown>
  ): Promise<void> {
    try {
      const tool = mcpTools.find((t) => t.name === name)
      if (!tool) {
        this.respond(id, {
          error: { code: -32601, message: `Tool not found: ${name}` },
        })
        return
      }
      const result = await tool.handler(args)
      this.respond(id, { result })
    } catch (err) {
      this.respond(id, {
        error: {
          code: -32603,
          message: err instanceof Error ? err.message : String(err),
        },
      })
    }
  }

  private respond(id: number | string, result: unknown): void {
    const response = { jsonrpc: '2.0' as const, id, result }
    writeMcpStdioMessage(this.encoder, response)
  }
}

async function main() {
  new SimpleMcpServer()
  console.error('ADT LSP MCP server started (stdio mode)')
  console.error('Tools:', mcpTools.map((t) => t.name).join(', '))
}

main().catch((error) => {
  console.error('Server error:', error)
  process.exit(1)
})
