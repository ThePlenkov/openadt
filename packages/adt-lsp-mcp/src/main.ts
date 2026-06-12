#!/usr/bin/env bun
/**
 * ADT LSP MCP Server - stdio-only MCP server for 26 OpenADT tools
 *
 * Usage: adt-lsp-mcp <destination>
 * Or set OPENADT_DESTINATION / OPENADT_MCP_DESTINATION.
 */
import { mcpTools, listMcpToolDescriptors } from '@openadt/adt-lsp-mcp-tools'
import {
  attachMcpStdoutEncoder,
  McpStdioDecoder,
  McpStdioEncoder,
  writeMcpStdioMessage,
} from '@openadt/mcp-framing'
import { locateAdtLs } from './locate'
import {
  connectAdtLanguageServer,
  ensureDestinationProjectAndLogon,
  LspConnectionTransport,
  prewarmDestination,
  type LspSession,
} from '@openadt/adt-lsp-client'
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
  private readonly boundDestination: string | undefined
  private readonly readyDestinations = new Set<string>()

  constructor(boundDestination: string | undefined) {
    this.boundDestination = boundDestination || undefined
    attachMcpStdoutEncoder(this.encoder)
    this.decoder.on('transport', (mode) => {
      this.encoder.setTransport(mode)
    })
    this.decoder.on('error', (err: Error) => {
      console.error(`[adt-lsp-mcp] stdio decode error: ${err.message}`)
    })
    this.decoder.on('data', (body: string) => {
      void this.onMessage(body)
    })
    process.stdin.pipe(this.decoder)
  }

  /** Pre-logon when destination is bound at startup; per-tool mode connects lazily. */
  startLspInBackground(): void {
    if (!this.boundDestination) {
      return
    }
    this.beginLspConnect(this.boundDestination)
  }

  private beginLspConnect(destination: string): void {
    if (this.lspReady) {
      return
    }
    this.lspReady = this.connectLsp(destination).catch((err: unknown) => {
      this.lspReady = undefined
      const error = err instanceof Error ? err : new Error(String(err))
      console.error(`[adt-lsp-mcp] LSP connect failed: ${error.message}`)
      throw error
    })
    void this.lspReady.catch(() => {
      /* surfaced via ensureLspReady on tools/call */
    })
  }

  private async connectLsp(destination: string): Promise<void> {
    if (this.lspSession) {
      await this.ensureDestinationReady(destination)
      return
    }

    const install = locateAdtLs()
    if (!install) {
      throw new Error('ADT LS not found. Install SAP ADT VS Code extension or set ADT_LS_PATH')
    }

    console.error(`ADT LS: ${install.adtLscPath} (${install.version})`)
    console.error(`Destination: ${destination}`)

    this.lspSession = await connectAdtLanguageServer(install, DEFAULT_WORKSPACE, {
      destinationsStorePath: join(homedir(), '.adtls'),
      createProjectIds: [destination],
      ensureLoggedOnIds: [destination],
    })
    this.readyDestinations.add(destination)

    const transport = new LspConnectionTransport(this.lspSession.connection)
    void prewarmDestination(transport, destination)

    console.error('LSP connection established')
  }

  private async ensureDestinationReady(destination: string): Promise<void> {
    if (this.readyDestinations.has(destination) || !this.lspSession) {
      return
    }
    await ensureDestinationProjectAndLogon(this.lspSession.connection, destination)
    this.readyDestinations.add(destination)
    void prewarmDestination(new LspConnectionTransport(this.lspSession.connection), destination)
  }

  private async ensureLspReady(callDestination?: string): Promise<LspSession> {
    const destination = this.boundDestination ?? callDestination
    if (!destination) {
      throw new Error(
        'Missing destination. Set OPENADT_MCP_DESTINATION at server startup or pass destination in tool arguments.'
      )
    }

    if (!this.lspReady) {
      this.beginLspConnect(destination)
    }
    await this.lspReady
    if (!this.lspSession) {
      throw new Error('LSP session not initialized')
    }
    await this.ensureDestinationReady(destination)
    return this.lspSession
  }

  private async onMessage(body: string): Promise<void> {
    try {
      const parsed = JSON.parse(body) as JsonRpcRequest
      if (parsed.id === undefined) return
      await this.dispatchMethod(parsed.id, parsed)
    } catch (err) {
      console.error('MCP message error:', err)
    }
  }

  private async dispatchMethod(id: string | number, parsed: JsonRpcRequest): Promise<void> {
    switch (parsed.method) {
      case 'initialize':
        await this.sendResult(id, this.buildInitializeResult())
        return
      case 'prompts/list':
        await this.sendResult(id, { prompts: guidancePromptDefs() })
        return
      case 'prompts/get':
        await this.handlePromptsGet(id, parsed.params)
        return
      case 'tools/list':
        await this.sendResult(id, { tools: this.listToolDescriptors() })
        return
      case 'tools/call':
        await this.handleToolCall(id, parsed.params)
        return
      default:
        await this.sendError(id, -32601, `Method not found: ${parsed.method ?? '(none)'}`)
    }
  }

  private buildInitializeResult() {
    const destinationHint = this.boundDestination
      ? ` Session destination: ${this.boundDestination} (bound at startup — destination is omitted from tool schemas).`
      : ' Per-tool mode: pass destination in each tool call (same as standard SAP MCP). Optional: bind one destination at startup via CLI/env to hide the field.'
    return {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {}, prompts: {} },
      serverInfo: { name: 'adt-lsp-mcp', version: '0.1.0' },
      instructions: `Fetch MCP prompt "${ADT_LSP_WORKFLOW_PROMPT}" via prompts/get before using adt_* transport or object tools.${destinationHint}`,
    }
  }

  private listToolDescriptors() {
    return listMcpToolDescriptors({ boundDestination: this.boundDestination })
  }

  private resolveToolArguments(args: Record<string, unknown> | undefined): Record<string, unknown> {
    const merged = { ...(args ?? {}) }
    if (this.boundDestination) {
      merged.destination = this.boundDestination
    }
    return merged
  }

  private async handlePromptsGet(id: number | string, params: unknown): Promise<void> {
    const promptParams = params as { name?: string } | undefined
    const promptName = promptParams?.name ?? ''
    if (!isGuidancePrompt(promptName)) {
      await this.sendError(id, -32602, `Unknown prompt: ${promptName}`)
      return
    }
    await this.sendResult(id, getGuidancePrompt(promptName))
  }

  private isValidToolArguments(args: unknown): args is Record<string, unknown> | undefined {
    if (args === undefined) return true
    return typeof args === 'object' && args !== null && !Array.isArray(args)
  }

  private async handleToolCall(id: number | string, params: unknown): Promise<void> {
    const call = params as { name?: string; arguments?: unknown } | undefined
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
    const args = call?.arguments
    if (!this.isValidToolArguments(args)) {
      await this.sendError(
        id,
        -32602,
        `Invalid tool arguments: expected object, got ${typeof args}`
      )
      return
    }
    try {
      const merged = this.resolveToolArguments(args)
      const callDestination =
        typeof merged.destination === 'string' ? merged.destination.trim() : undefined
      const session = await this.ensureLspReady(callDestination)
      const transport = new LspConnectionTransport(session.connection)
      const result = await tool.handler(merged as never, transport)
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
  const boundDestination = resolveDestination(process.argv.slice(2))
  if (boundDestination) {
    console.error(`[adt-lsp-mcp] Bound destination: ${boundDestination}`)
  } else {
    console.error(
      '[adt-lsp-mcp] Per-tool destination mode — pass destination in each tool call (standard SAP MCP).'
    )
  }

  const server = new SimpleMcpServer(boundDestination)
  if (boundDestination) {
    server.startLspInBackground()
  }

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
