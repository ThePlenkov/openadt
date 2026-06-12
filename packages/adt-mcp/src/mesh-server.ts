/**
 * Mesh MCP dispatcher (transport-agnostic).
 *
 * Merges two tool groups behind one MCP surface:
 *  - **SAP `abap_*`** — proxied to the SAP HTTP MCP via `SapHttpMcpClient`.
 *  - **OpenADT `adt_*`** — run in-process over the owned LSP session.
 *  - **OpenADT `openadt_*`** — in-process utilities (no SAP/LSP required).
 *
 * Plus OpenADT-owned prompts (TS) and SAP tool-name shortening for agent
 * backends with name limits. The stdio and HTTP transports both call
 * `handle()`; this class owns no I/O. Modeled on the dispatcher in
 * `@openadt/adt-lsp-mcp` but spanning both groups.
 */
import type { McpServeConfig } from '@openadt/adt-config'
import type { SapSource } from './sap-mcp/source.js'
import type { McpTool } from './sap-mcp/client.js'
import { callLspTool, isLspToolName, listLspToolDescriptors } from './lsp-tools.js'
import { augmentInstructions, getPrompt, listPrompts } from './prompts.js'
import { ToolNameRegistry, maxMcpToolNameLenFromEnv } from './tool-name-limit.js'
import { deriveDestinations } from './destinations.js'

const PROTOCOL_VERSION = '2024-11-05'

type JsonRpcRequest = {
  jsonrpc?: string
  id?: number | string | null
  method?: string
  params?: unknown
}

type JsonRpcResponse = {
  jsonrpc: '2.0'
  id: number | string | null
  result?: unknown
  error?: { code: number; message: string }
}

export type MeshServerDeps = {
  cfg: McpServeConfig
  source: SapSource
  /** SAP tools fetched once at startup (empty when proxy disabled/unavailable). */
  sapTools: McpTool[]
}

export class MeshMcpServer {
  private readonly cfg: McpServeConfig
  private readonly source: SapSource
  private readonly sapTools: McpTool[]
  private readonly registry = new ToolNameRegistry(maxMcpToolNameLenFromEnv())
  /** Whether the `adt_*` group is active (enabled + own session available). */
  private readonly lspActive: boolean

  constructor(deps: MeshServerDeps) {
    this.cfg = deps.cfg
    this.source = deps.source
    this.sapTools = deps.sapTools
    this.lspActive = deps.cfg.lsp && deps.source.session !== null
  }

  /** Handle one JSON-RPC message. Returns a response, or null for notifications. */
  async handle(request: JsonRpcRequest): Promise<JsonRpcResponse | null> {
    const id = request.id ?? null
    if (request.id === undefined || request.id === null) {
      // Notification (e.g. notifications/initialized): nothing to return.
      return null
    }
    try {
      return { jsonrpc: '2.0', id, result: await this.dispatch(request) }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { jsonrpc: '2.0', id, error: { code: -32603, message } }
    }
  }

  private async dispatch(request: JsonRpcRequest): Promise<unknown> {
    switch (request.method) {
      case 'initialize':
        return this.initializeResult()
      case 'tools/list':
        return { tools: this.listTools() }
      case 'tools/call':
        return this.callTool(request.params)
      case 'prompts/list':
        return { prompts: listPrompts() }
      case 'prompts/get':
        return this.promptsGet(request.params)
      default:
        throw new MethodNotFound(request.method)
    }
  }

  private initializeResult(): unknown {
    return {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {}, prompts: {} },
      serverInfo: { name: 'openadt-mcp', version: '0.1.0' },
      instructions: augmentInstructions(undefined),
    }
  }

  listTools(): McpTool[] {
    const sap = this.sapTools.map((tool) => ({
      ...tool,
      name: this.registry.exportName(tool.name),
    }))
    const openadt = [
      {
        name: 'openadt_list_destinations',
        description:
          'List all ADT destinations from ~/.adtls/destinations.json (no SAP logon required)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ].map((tool) => ({
      ...tool,
      name: this.registry.exportName(tool.name),
    }))
    if (!this.lspActive) {
      return [...sap, ...openadt]
    }
    const lsp = listLspToolDescriptors().map((d) => ({
      name: d.name,
      description: d.description,
      inputSchema: d.inputSchema,
    }))
    return [...sap, ...openadt, ...lsp]
  }

  private async callTool(params: unknown): Promise<unknown> {
    const call = params as { name?: string; arguments?: unknown } | undefined
    const exposed = call?.name
    if (!exposed) {
      throw new Error('Missing tool name')
    }
    const name = this.registry.importName(exposed)
    const args = (call?.arguments ?? {}) as Record<string, unknown>

    // OpenADT in-process tools (no SAP/LSP required)
    if (name === 'openadt_list_destinations') {
      const { ids } = deriveDestinations()
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ destinations: ids }, null, 2),
          },
        ],
      }
    }

    if (this.lspActive && isLspToolName(name)) {
      return callLspTool(this.source.session!, name, args)
    }
    if (this.source.client) {
      return this.source.client.callTool(name, args)
    }
    throw new Error(`No backend for tool: ${name}`)
  }

  private promptsGet(params: unknown): unknown {
    const p = params as { name?: string; arguments?: Record<string, string> } | undefined
    const name = p?.name ?? ''
    const result = getPrompt(name, p?.arguments ?? {})
    if (!result) {
      throw new Error(`Unknown prompt: ${name}`)
    }
    return result
  }
}

class MethodNotFound extends Error {
  constructor(method: string | undefined) {
    super(`Method not found: ${method ?? '(none)'}`)
  }
}

/**
 * Collect the SAP tool list once (best effort). Returns [] and logs when the SAP
 * backend is unavailable so the mesh can still serve the `adt_*` group.
 */
export async function collectSapTools(source: SapSource): Promise<McpTool[]> {
  if (!source.client) {
    return []
  }
  try {
    const tools = await source.client.listTools()
    console.error(`[openadt-mcp] loaded ${tools.length} SAP abap_* tools`)
    return tools
  } catch (err) {
    console.error(`[openadt-mcp] SAP tools/list failed: ${String(err)}`)
    return []
  }
}
