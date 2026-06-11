/**
 * OpenADT project adapter — SAP/MCP wiring for the generic e2e-agent skill.
 * Not part of the portable skill package.
 */
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { pipeline } from 'node:stream'
import { frameMcpMessage, McpFrameDecoder } from '@openadt/mcp-framing'
import type {
  E2eProjectAdapter,
  ToolExecutor,
} from '../.agents/skills/e2e/scripts/framework/adapter-types'
import type {
  RunContext,
  Scenario,
  ScenarioMode,
} from '../.agents/skills/e2e/scripts/framework/types'

type DestinationOptions = {
  destination?: string
  system?: string
  user?: string
  client?: string
  resolveDestination?: boolean
}

type AdtlsEntry = {
  id?: string
  properties?: Record<string, string>
}

function repoRoot(): string {
  return join(import.meta.dir, '..')
}

function isPartialDestination(destination: string): boolean {
  return destination.split('_').length < 4
}

function resolveDestinationId(opts: DestinationOptions): string {
  const fromEnv = process.env.OPENADT_MCP_DESTINATION?.trim()
  const destination = opts.destination?.trim() || fromEnv
  if (destination) {
    if (isPartialDestination(destination) && !opts.resolveDestination) {
      console.error(
        `[openadt-adapter] Partial destination "${destination}" — resolving from ~/.adtls/destinations.json`
      )
      return resolveDestinationId({
        destination: undefined,
        system: destination,
        user: opts.user,
        client: opts.client,
        resolveDestination: true,
      })
    }
    return destination
  }
  if (!opts.resolveDestination && !opts.system) {
    throw new Error(
      'Missing destination. Pass --destination SID_CLIENT_USER_LANG or a partial SID (e.g. ABC).'
    )
  }
  const path = join(homedir(), '.adtls', 'destinations.json')
  if (!existsSync(path)) throw new Error(`No adtls store at ${path}`)
  const store = JSON.parse(readFileSync(path, 'utf8')) as { destinations?: AdtlsEntry[] }
  const system = opts.system ?? opts.destination
  if (!system) throw new Error('--resolve-destination requires --system or --destination hint')
  const matches = (store.destinations ?? []).filter((d) => {
    const p = d.properties ?? {}
    if (p.systemId?.toUpperCase() !== system.toUpperCase()) return false
    if (opts.client && p.client !== opts.client) return false
    if (opts.user && p.user?.toUpperCase() !== opts.user.toUpperCase()) return false
    return Boolean(d.id?.trim())
  })
  if (matches.length === 0) throw new Error(`No adtls destination for system=${system}`)
  if (matches.length > 1) {
    throw new Error(
      `Ambiguous adtls match (${matches.map((m) => m.id).join(', ')}); pass --destination explicitly.`
    )
  }
  return matches[0]!.id!.trim()
}

function resolveSuiteId(scenario: Scenario): 'adtls' | 'mcp' {
  if (scenario.code.startsWith('ls-')) return 'adtls'
  if (scenario.code.startsWith('mcp-')) return 'mcp'
  throw new Error(`Unknown OpenADT suite for scenario ${scenario.code}`)
}

class McpLauncherClient implements ToolExecutor {
  private child: ChildProcessWithoutNullStreams
  private nextId = 1
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()
  private ready = false
  private readyResolve!: () => void
  private readonly readyPromise: Promise<void>

  constructor(
    private launcher: string,
    private ctx: RunContext,
    private mode: ScenarioMode
  ) {
    this.readyPromise = new Promise((resolve) => {
      this.readyResolve = resolve
    })
    const args = [
      'serve',
      '--stdio',
      ...(this.mode === 'standalone' ? ['--standalone'] : []),
      `--import-from=${ctx.importFrom ?? 'adtls'}`,
      '--destination',
      String(ctx.destination),
      '--port',
      String(ctx.port ?? 2239),
    ]
    this.child = spawn('bun', [launcher, ...args], {
      stdio: ['pipe', 'pipe', 'inherit'],
      windowsHide: true,
    }) as ChildProcessWithoutNullStreams
    const decoder = new McpFrameDecoder()
    pipeline(this.child.stdout, decoder, () => {})
    decoder.on('data', (body: string) => this.onMessage(body))
    this.child.on('exit', (code) => {
      for (const p of this.pending.values()) p.reject(new Error(`MCP exited ${code ?? 1}`))
      this.pending.clear()
    })
  }

  private onMessage(body: string): void {
    let parsed: { id?: number; result?: unknown; error?: { message: string } }
    try {
      parsed = JSON.parse(body)
    } catch {
      return
    }
    if (parsed.id === undefined) return
    const slot = this.pending.get(parsed.id)
    if (!slot) return
    this.pending.delete(parsed.id)
    if (parsed.error) slot.reject(new Error(parsed.error.message))
    else slot.resolve(parsed.result)
  }

  private request(method: string, params?: unknown): Promise<unknown> {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.child.stdin.write(frameMcpMessage({ jsonrpc: '2.0', id, method, params }))
    })
  }

  async start(): Promise<void> {
    await this.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'e2e-agent-openadt', version: '1.0.0' },
    })
    this.child.stdin.write(frameMcpMessage({ jsonrpc: '2.0', method: 'notifications/initialized' }))
    this.ready = true
    this.readyResolve()
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.ready) await this.readyPromise
    return this.request('tools/call', { name, arguments: args })
  }

  close(): void {
    if (!this.child.killed) this.child.kill()
  }
}

function adtLspEntry(): string {
  const built = join(repoRoot(), 'tools', 'adt-lsp-mcp', 'dist', 'main.mjs')
  if (existsSync(built)) return built
  return join(repoRoot(), 'tools', 'adt-lsp-mcp', 'src', 'main.ts')
}

class AdtLspMcpClient implements ToolExecutor {
  private child: ChildProcessWithoutNullStreams
  private nextId = 1
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()
  private ready = false
  private readyResolve!: () => void
  private readonly readyPromise: Promise<void>

  constructor(
    private launcher: string,
    private destination: string,
    private toolTimeoutMs: number
  ) {
    this.readyPromise = new Promise((resolve) => {
      this.readyResolve = resolve
    })
    const cmd = launcher.endsWith('.ts') ? 'bun' : 'node'
    const args = launcher.endsWith('.ts') ? [launcher, destination] : [launcher, destination]
    this.child = spawn(cmd, args, {
      stdio: ['pipe', 'pipe', 'inherit'],
      windowsHide: true,
    }) as ChildProcessWithoutNullStreams
    const decoder = new McpFrameDecoder()
    pipeline(this.child.stdout, decoder, () => {})
    decoder.on('data', (body: string) => this.onMessage(body))
    this.child.on('exit', (code) => {
      for (const p of this.pending.values()) p.reject(new Error(`MCP exited ${code ?? 1}`))
      this.pending.clear()
    })
  }

  private onMessage(body: string): void {
    let parsed: { id?: number; result?: unknown; error?: { message: string } }
    try {
      parsed = JSON.parse(body)
    } catch {
      return
    }
    if (parsed.id === undefined) return
    const slot = this.pending.get(parsed.id)
    if (!slot) return
    this.pending.delete(parsed.id)
    if (parsed.error) slot.reject(new Error(parsed.error.message))
    else slot.resolve(parsed.result)
  }

  private request(method: string, params?: unknown, timeoutMs?: number): Promise<unknown> {
    const id = this.nextId++
    const ms = timeoutMs ?? 30_000
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`${method} timed out after ${ms}ms`))
      }, ms)
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer)
          resolve(value)
        },
        reject: (err) => {
          clearTimeout(timer)
          reject(err)
        },
      })
      this.child.stdin.write(frameMcpMessage({ jsonrpc: '2.0', id, method, params }))
    })
  }

  async start(): Promise<void> {
    await this.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'e2e-agent-openadt', version: '1.0.0' },
    })
    this.child.stdin.write(frameMcpMessage({ jsonrpc: '2.0', method: 'notifications/initialized' }))
    this.ready = true
    this.readyResolve()
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.ready) await this.readyPromise
    return this.request('tools/call', { name, arguments: args }, this.toolTimeoutMs)
  }

  close(): void {
    if (!this.child.killed) this.child.kill()
  }
}

const adapter: E2eProjectAdapter = {
  resolveParams(raw, _suiteId) {
    const destination = resolveDestinationId({
      destination: String(raw.destination ?? ''),
      system: raw.system ? String(raw.system) : undefined,
      user: raw.user ? String(raw.user) : undefined,
      client: raw.client ? String(raw.client) : undefined,
      resolveDestination: raw['resolve-destination'] === true || raw.resolveDestination === true,
    })
    return {
      destination,
      importFrom: raw['import-from'] ? String(raw['import-from']) : 'adtls',
      port: Number(raw.port ?? 2239),
      timeoutMs: Number(raw['timeout-ms'] ?? raw.timeoutMs ?? 300_000),
    }
  },

  createExecutor(scenario, ctx, _suiteId) {
    const suite = resolveSuiteId(scenario)
    if (suite === 'adtls') {
      return new AdtLspMcpClient(
        adtLspEntry(),
        String(ctx.destination),
        Number(ctx.timeoutMs ?? 300_000)
      )
    }
    return new McpLauncherClient(
      join(repoRoot(), 'tools', 'sap-adt-mcp-launcher', 'src', 'cli', 'main.ts'),
      ctx,
      scenario.mode ?? 'standalone'
    )
  },

  serviceMode(scenario) {
    return resolveSuiteId(scenario) === 'adtls'
      ? 'adt-lsp-mcp (direct LSP stdio)'
      : 'mcp-launcher (stdio)'
  },
}

export default adapter
