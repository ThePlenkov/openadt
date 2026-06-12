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

function loadAdtlsStore(): { destinations?: AdtlsEntry[] } {
  const path = join(homedir(), '.adtls', 'destinations.json')
  if (!existsSync(path)) throw new Error(`No adtls store at ${path}`)
  return JSON.parse(readFileSync(path, 'utf8')) as { destinations?: AdtlsEntry[] }
}

function entryHasId(entry: AdtlsEntry): boolean {
  return Boolean(entry.id?.trim())
}

function entryMatchesSystem(entry: AdtlsEntry, system: string): boolean {
  return (entry.properties?.systemId?.toUpperCase() ?? '') === system.toUpperCase()
}

function entryMatchesClient(entry: AdtlsEntry, client: string | undefined): boolean {
  if (!client) return true
  return entry.properties?.client === client
}

function entryMatchesUser(entry: AdtlsEntry, user: string | undefined): boolean {
  if (!user) return true
  return entry.properties?.user?.toUpperCase() === user.toUpperCase()
}

function matchesAdtlsEntry(
  entry: AdtlsEntry,
  system: string,
  client: string | undefined,
  user: string | undefined
): boolean {
  if (!entryMatchesSystem(entry, system)) return false
  if (!entryMatchesClient(entry, client)) return false
  if (!entryMatchesUser(entry, user)) return false
  return entryHasId(entry)
}

function resolveFromAdtlsStore(opts: DestinationOptions, system: string): string {
  const store = loadAdtlsStore()
  const matches = (store.destinations ?? []).filter((d) =>
    matchesAdtlsEntry(d, system, opts.client, opts.user)
  )
  if (matches.length === 0) throw new Error(`No adtls destination for system=${system}`)
  if (matches.length > 1) {
    throw new Error(
      `Ambiguous adtls match (${matches.map((m) => m.id).join(', ')}); pass --destination explicitly.`
    )
  }
  return matches[0]!.id!.trim()
}

function resolvePartialDestination(opts: DestinationOptions, partial: string): string {
  console.error(
    `[openadt-adapter] Partial destination "${partial}" — resolving from ~/.adtls/destinations.json`
  )
  return resolveDestinationId({
    destination: undefined,
    system: partial,
    user: opts.user,
    client: opts.client,
    resolveDestination: true,
  })
}

function readDestinationOrEnv(opts: DestinationOptions): string | undefined {
  return opts.destination?.trim() || process.env.OPENADT_MCP_DESTINATION?.trim()
}

function assertResolvableWithoutDestination(opts: DestinationOptions): void {
  if (opts.resolveDestination || opts.system) return
  throw new Error(
    'Missing destination. Pass --destination SID_CLIENT_USER_LANG or a partial SID (e.g. ABC).'
  )
}

function resolveDestinationId(opts: DestinationOptions): string {
  const destination = readDestinationOrEnv(opts)
  if (destination) {
    if (isPartialDestination(destination) && !opts.resolveDestination) {
      return resolvePartialDestination(opts, destination)
    }
    return destination
  }
  assertResolvableWithoutDestination(opts)
  const system = opts.system ?? opts.destination
  if (!system) throw new Error('--resolve-destination requires --system or --destination hint')
  return resolveFromAdtlsStore(opts, system)
}

function resolveSuiteId(scenario: Scenario): 'adtls' | 'mcp' {
  if (scenario.code.startsWith('ls-')) return 'adtls'
  if (scenario.code.startsWith('mcp-')) return 'mcp'
  throw new Error(`Unknown OpenADT suite for scenario ${scenario.code}`)
}

type JsonRpcResponse = {
  id?: number
  result?: unknown
  error?: { message: string }
}

abstract class JsonRpcMcpClient implements ToolExecutor {
  protected nextId = 1
  protected pending = new Map<
    number,
    { resolve: (v: unknown) => void; reject: (e: Error) => void }
  >()
  protected ready = false
  protected readyResolve!: () => void
  protected readonly readyPromise: Promise<void>

  constructor(
    protected child: ChildProcessWithoutNullStreams,
    ready: { promise: Promise<void>; resolve: () => void }
  ) {
    this.readyPromise = ready.promise
    this.readyResolve = ready.resolve
    this.child.on('exit', (code) => {
      for (const p of this.pending.values()) p.reject(new Error(`MCP exited ${code ?? 1}`))
      this.pending.clear()
    })
  }

  protected wireDecoder(decoder: McpFrameDecoder): void {
    pipeline(this.child.stdout, decoder, () => {})
    decoder.on('data', (body: string) => this.onMessage(body))
  }

  private onMessage(body: string): void {
    let parsed: JsonRpcResponse
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

  protected send(method: string, params?: unknown): void {
    this.child.stdin.write(frameMcpMessage({ jsonrpc: '2.0', id: this.nextId++, method, params }))
  }

  protected request(method: string, params?: unknown, timeoutMs?: number): Promise<unknown> {
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

  protected initializeAndReady(clientName: string): Promise<void> {
    return this.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: clientName, version: '1.0.0' },
    }).then(() => {
      this.child.stdin.write(
        frameMcpMessage({ jsonrpc: '2.0', method: 'notifications/initialized' })
      )
      this.ready = true
      this.readyResolve()
    })
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

class McpLauncherClient extends JsonRpcMcpClient {
  private readonly readyHandle: { promise: Promise<void>; resolve: () => void }

  constructor(
    private launcher: string,
    private ctx: RunContext,
    private mode: ScenarioMode
  ) {
    const ready = { promise: Promise.resolve(), resolve: () => {} } as {
      promise: Promise<void>
      resolve: () => void
    }
    ready.promise = new Promise<void>((resolve) => {
      ready.resolve = resolve
    })
    const args = [
      'serve',
      '--stdio',
      ...(mode === 'standalone' ? ['--standalone'] : []),
      `--import-from=${ctx.importFrom ?? 'adtls'}`,
      '--destination',
      String(ctx.destination),
      '--port',
      String(ctx.port ?? 2239),
    ]
    const child = spawn('bun', [launcher, ...args], {
      stdio: ['pipe', 'pipe', 'inherit'],
      windowsHide: true,
    }) as ChildProcessWithoutNullStreams
    super(child, ready)
    this.readyHandle = ready
    this.wireDecoder(new McpFrameDecoder())
  }

  start(): Promise<void> {
    return this.initializeAndReady('e2e-agent-openadt')
  }
}

class AdtLspMcpClient extends JsonRpcMcpClient {
  private readonly readyHandle: { promise: Promise<void>; resolve: () => void }

  constructor(
    private launcher: string,
    private destination: string,
    private toolTimeoutMs: number
  ) {
    const ready = { promise: Promise.resolve(), resolve: () => {} } as {
      promise: Promise<void>
      resolve: () => void
    }
    ready.promise = new Promise<void>((resolve) => {
      ready.resolve = resolve
    })
    const cmd = launcher.endsWith('.ts') ? 'bun' : 'node'
    const child = spawn(cmd, [launcher, destination], {
      stdio: ['pipe', 'pipe', 'inherit'],
      windowsHide: true,
    }) as ChildProcessWithoutNullStreams
    super(child, ready)
    this.readyHandle = ready
    this.wireDecoder(new McpFrameDecoder())
  }

  start(): Promise<void> {
    return this.initializeAndReady('e2e-agent-openadt')
  }

  override async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.ready) await this.readyPromise
    return this.request('tools/call', { name, arguments: args }, this.toolTimeoutMs)
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
