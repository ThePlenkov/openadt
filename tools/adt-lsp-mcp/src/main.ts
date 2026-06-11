#!/usr/bin/env bun
/**
 * ADT LSP MCP Server - stdio-only MCP server for 26 OpenADT tools
 *
 * Usage: adt-lsp-mcp <destination>
 * Or set OPENADT_DESTINATION / OPENADT_MCP_DESTINATION.
 */
import { mcpTools } from '@openadt/adt-mcp-tools'
import {
  attachMcpStdoutEncoder,
  McpStdioDecoder,
  McpStdioEncoder,
  writeMcpStdioMessage,
} from '@openadt/mcp-framing'
import { locateAdtLs } from './locate'
import {
  connectAdtLanguageServer,
  LspConnectionTransport,
  type LspSession,
} from '@openadt/lsp-client'
import { DEFAULT_WORKSPACE } from '@openadt/adt-config'
import { homedir } from 'node:os'
import { join } from 'node:path'
import {
  ADT_LSP_WORKFLOW_PROMPT,
  getGuidancePrompt,
  guidancePromptDefs,
  isGuidancePrompt,
} from './guidance/guidance'

type JsonRpcRequest = {
  id?: number | string
  method?: string
  params?: unknown
}

class SimpleMcpServer {
  private encoder = new McpStdioEncoder()
  private decoder = new McpStdioDecoder()
  private lspSession: LspSession | undefined
  private lspReady: Promise<void> | undefined
  private readonly destination: string

  constructor(destination: string) {
    this.destination = destination
    attachMcpStdoutEncoder(this.encoder)
    this.decoder.on('data', (body: string) => {
      void this.onMessage(body)
    })
    process.stdin.pipe(this.decoder)
  }

  /** Connect adt-lsc in the background; MCP initialize/tools/list do not wait. */
  startLspInBackground(): void {
    this.lspReady = this.connectLsp().catch((err) => {
      this.lspReady = undefined
      throw err
    })
  }

  private async connectLsp(): Promise<void> {
    const install = locateAdtLs()
    if (!install) {
      throw new Error('ADT LS not found. Install SAP ADT VS Code extension or set ADT_LS_PATH')
    }

    console.error(`ADT LS: ${install.adtLscPath} (${install.version})`)
    console.error(`Destination: ${this.destination}`)

    this.lspSession = await connectAdtLanguageServer(install, DEFAULT_WORKSPACE, {
      destinationsStorePath: join(homedir(), '.adtls'),
      createProjectIds: [this.destination],
      ensureLoggedOnIds: [this.destination],
    })

    console.error('LSP connection established')
  }

  private async ensureLspReady(): Promise<LspSession> {
    if (!this.lspReady) {
      this.startLspInBackground()
    }
    await this.lspReady
    if (!this.lspSession) {
      throw new Error('LSP session not initialized')
    }
    return this.lspSession
  }

  private async onMessage(body: string): Promise<void> {
    try {
      const parsed = JSON.parse(body) as JsonRpcRequest
      if (parsed.id === undefined) return

      switch (parsed.method) {
        case 'initialize':
          await this.sendResult(parsed.id, {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {}, prompts: {} },
            serverInfo: { name: 'adt-lsp-mcp', version: '0.1.0' },
            instructions: `Fetch MCP prompt "${ADT_LSP_WORKFLOW_PROMPT}" via prompts/get before using adt_* transport or object tools.`,
          })
          return
        case 'prompts/list':
          await this.sendResult(parsed.id, { prompts: guidancePromptDefs() })
          return
        case 'prompts/get': {
          const promptParams = parsed.params as { name?: string } | undefined
          const promptName = promptParams?.name ?? ''
          if (!isGuidancePrompt(promptName)) {
            await this.sendError(parsed.id, -32602, `Unknown prompt: ${promptName}`)
            return
          }
          await this.sendResult(parsed.id, getGuidancePrompt(promptName))
          return
        }
        case 'tools/list':
          await this.sendResult(parsed.id, {
            tools: mcpTools.map((t) => ({
              name: t.name,
              description: t.description,
              inputSchema: t.inputSchema,
            })),
          })
          return
        case 'tools/call':
          await this.handleToolCall(parsed.id, parsed.params)
          return
        default:
          await this.sendError(parsed.id, -32601, `Method not found: ${parsed.method ?? '(none)'}`)
      }
    } catch (err) {
      console.error('MCP message error:', err)
    }
  }

  private async handleToolCall(id: number | string, params: unknown): Promise<void> {
    const call = params as { name?: string; arguments?: Record<string, unknown> } | undefined
    const name = call?.name
    if (!name) {
      await this.sendError(id, -32602, 'Missing tool name')
      return
    }

    const tool = mcpTools.find((t) => t.name === name)
    if (!tool) {
      await this.sendError(id, -32601, `Tool not found: ${name}`)
      return
    }

    try {
      const args = call?.arguments
      if (
        args !== undefined &&
        (args === null || typeof args !== 'object' || Array.isArray(args))
      ) {
        await this.sendError(
          id,
          -32602,
          `Invalid tool arguments: expected object, got ${typeof args}`
        )
        return
      }
      const session = await this.ensureLspReady()
      const transport = new LspConnectionTransport(session.connection)
      const result = await tool.handler(args ?? {}, transport)
      await this.sendResult(id, result)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await this.sendError(id, -32603, message)
    }
  }

  private async sendResult(id: number | string, result: unknown): Promise<void> {
    await writeMcpStdioMessage(this.encoder, { jsonrpc: '2.0', id, result })
  }

  private async sendError(id: number | string, code: number, message: string): Promise<void> {
    await writeMcpStdioMessage(this.encoder, {
      jsonrpc: '2.0',
      id,
      error: { code, message },
    })
  }

  shutdown(): void {
    if (this.lspSession) {
      this.lspSession.connection.dispose()
      this.lspSession.child.kill()
    }
  }
}

function resolveDestination(argv: string[]): string | undefined {
  const fromArg = argv.find((a) => !a.startsWith('-'))
  return fromArg ?? process.env.OPENADT_DESTINATION ?? process.env.OPENADT_MCP_DESTINATION
}

async function main(): Promise<void> {
  const destination = resolveDestination(process.argv.slice(2))
  if (!destination) {
    console.error('Usage: adt-lsp-mcp <destination>')
    console.error('Or set OPENADT_DESTINATION / OPENADT_MCP_DESTINATION')
    process.exit(1)
  }

  const server = new SimpleMcpServer(destination)
  server.startLspInBackground()

  console.error('ADT LSP MCP server started (stdio mode)')
  console.error('Tools:', mcpTools.map((t) => t.name).join(', '))

  process.on('SIGINT', () => {
    server.shutdown()
    process.exit(0)
  })
  process.on('SIGTERM', () => {
    server.shutdown()
    process.exit(0)
  })
}

main().catch((error) => {
  console.error('Server error:', error)
  process.exit(1)
})
