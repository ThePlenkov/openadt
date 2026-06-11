import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { RunContext } from './types'

export const DEFAULT_E2E_AGENT = 'openadt-runner'
export const DEFAULT_E2E_MODEL = '(none — deterministic MCP runner)'

export const ACP_AGENTS_URL = 'https://agentclientprotocol.com/overview/agents'
export const ACP_GET_STARTED_URL = 'https://agentclientprotocol.com/get-started/introduction'

/** Who runs the SAP-backed scenario (local bun vs external ACP agent). */
export type E2eExecutor = 'local' | 'acp'

export const ACP_EXECUTOR_ALIASES = ['acp'] as const

export type CliOptions = {
  destination?: string
  system?: string
  user?: string
  client?: string
  resolveDestination: boolean
  importFrom: string
  port: number
  timeoutMs: number
  scenario?: string
  list: boolean
  evidence: boolean
  evidenceRoot?: string
  agent?: string
  model?: string
  executor: E2eExecutor
}

export function getCliFlag(argv: string[], flag: string): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!
    if (arg === flag) {
      const next = argv[i + 1]
      return next && !next.startsWith('-') ? next : undefined
    }
    const prefix = `${flag}=`
    if (arg.startsWith(prefix)) {
      const value = arg.slice(prefix.length)
      return value.length > 0 ? value : undefined
    }
  }
  return undefined
}

const LOCAL_EXECUTOR_ALIASES = ['local', 'cursor', 'openadt-runner'] as const

function isLocalExecutorAlias(norm: string): boolean {
  return (LOCAL_EXECUTOR_ALIASES as readonly string[]).includes(norm)
}

function isAcpExecutorAlias(norm: string): boolean {
  return (ACP_EXECUTOR_ALIASES as readonly string[]).includes(norm)
}

function resolveExecutorFromFlag(raw: string): E2eExecutor {
  const norm = raw.toLowerCase().trim()
  if (isLocalExecutorAlias(norm)) return 'local'
  if (isAcpExecutorAlias(norm)) return 'acp'
  throw new Error(`Unknown executor "${raw}". Use acp (or --acp), or omit for local bun run.`)
}

export function resolveE2eExecutor(argv: string[]): E2eExecutor {
  if (argv.includes('--acp')) return 'acp'
  const raw = getCliFlag(argv, '--command') ?? getCliFlag(argv, '--executor')
  if (!raw) return 'local'
  return resolveExecutorFromFlag(raw)
}

export function resolveE2eAgent(opts: CliOptions): string {
  return opts.agent?.trim() || DEFAULT_E2E_AGENT
}

/** ACP registry agent id for dispatch — user-supplied, never defaulted. */
export function resolveAcpAgent(opts: CliOptions): string {
  const id = opts.agent?.trim() ?? process.env.ACP_AGENT?.trim()
  if (!id) {
    throw new Error(
      `ACP dispatch requires --agent <acp-agent-id> or env ACP_AGENT. ` + `See ${ACP_AGENTS_URL}`
    )
  }
  return id
}

export function resolveE2eModel(opts: CliOptions): string {
  return opts.model?.trim() || DEFAULT_E2E_MODEL
}

export function resolveE2eExecution(agent: string): string {
  return agent === DEFAULT_E2E_AGENT
    ? 'framework (bun runner — deterministic MCP tool calls, no LLM in loop)'
    : 'agent-orchestrated (LLM invoked runner; tool calls still deterministic via framework)'
}

function positionalScenario(argv: string[]): string | undefined {
  for (const arg of argv) {
    if (arg.startsWith('-')) continue
    return arg
  }
  return undefined
}

export function parseCli(argv: string[]): CliOptions {
  const get = (flag: string): string | undefined => getCliFlag(argv, flag)
  return {
    destination: get('--destination') ?? process.env.OPENADT_MCP_DESTINATION?.trim(),
    system: get('--system') ?? process.env.OPENADT_MCP_SYSTEM?.trim(),
    user: get('--user') ?? process.env.OPENADT_MCP_USER?.trim(),
    client: get('--client') ?? process.env.OPENADT_MCP_CLIENT?.trim(),
    resolveDestination: argv.includes('--resolve-destination'),
    importFrom: get('--import-from') ?? 'adtls',
    port: Number(get('--port') ?? '2239'),
    timeoutMs: Number(get('--timeout-ms') ?? '300000'),
    scenario: get('--scenario') ?? positionalScenario(argv),
    list: argv.includes('--list'),
    evidence: argv.includes('--evidence') || process.env.OPENADT_E2E_EVIDENCE === '1',
    evidenceRoot: get('--evidence-dir'),
    agent: get('--agent') ?? process.env.OPENADT_E2E_AGENT?.trim(),
    model: get('--model') ?? process.env.OPENADT_E2E_MODEL?.trim(),
    executor: resolveE2eExecutor(argv),
  }
}

type AdtlsEntry = {
  id?: string
  properties?: Record<string, string>
}

/**
 * Detect if destination is partial (not full SID_CLIENT_USER_LANG format).
 * Full format: ABC_123_USER_EN (3+ underscores, specific pattern)
 * Partial: anything else (e.g., ABC, ABC_123, USER, etc.)
 */
function isPartialDestination(destination: string): boolean {
  const parts = destination.split('_')
  // Full format typically has at least 4 parts: SID_CLIENT_USER_LANG
  return parts.length < 4
}

function resolveFromAdtlsStore(opts: CliOptions): string {
  if (!opts.resolveDestination) {
    throw new Error(
      'Missing destination. Pass --destination ABC_200_USER_EN or set OPENADT_MCP_DESTINATION. ' +
        'Use --resolve-destination --system ABC when id is in ~/.adtls/destinations.json.'
    )
  }
  if (!opts.system) {
    throw new Error('--resolve-destination requires --system (SID hint, not stored in scenarios).')
  }
  const path = join(homedir(), '.adtls', 'destinations.json')
  if (!existsSync(path)) {
    throw new Error(`No adtls store at ${path}`)
  }
  const store = JSON.parse(readFileSync(path, 'utf8')) as { destinations?: AdtlsEntry[] }
  return pickSingleAdtlsMatch(store.destinations ?? [], opts)
}

function pickSingleAdtlsMatch(destinations: AdtlsEntry[], opts: CliOptions): string {
  const system = opts.system
  const matches = destinations.filter((d) => matchesAdtlsEntry(d, opts, system!))
  if (matches.length === 0) {
    throw new Error(`No adtls destination for system=${system}`)
  }
  if (matches.length > 1) {
    const ids = matches.map((m) => m.id).join(', ')
    throw new Error(`Ambiguous adtls match (${ids}); pass --destination explicitly.`)
  }
  return matches[0]!.id!.trim()
}

function matchesAdtlsEntry(d: AdtlsEntry, opts: CliOptions, system: string): boolean {
  const p = d.properties ?? {}
  if (!systemIdMatches(p.systemId, system)) return false
  if (opts.client && p.client !== opts.client) return false
  if (opts.user && !userMatches(p.user, opts.user)) return false
  return Boolean(d.id?.trim())
}

function systemIdMatches(actual: string | undefined, expected: string): boolean {
  return actual?.toUpperCase() === expected.toUpperCase()
}

function userMatches(actual: string | undefined, expected: string): boolean {
  return actual?.toUpperCase() === expected.toUpperCase()
}

function autoResolvePartialDestination(opts: CliOptions): string {
  console.error(
    `[e2e] Partial destination "${opts.destination}" detected, auto-resolving from ~/.adtls/destinations.json`
  )
  return resolveDestinationId({
    ...opts,
    destination: undefined,
    resolveDestination: true,
    system: opts.destination,
  })
}

export function resolveDestinationId(opts: CliOptions): string {
  if (opts.destination) {
    if (isPartialDestination(opts.destination) && !opts.resolveDestination) {
      return autoResolvePartialDestination(opts)
    }
    return opts.destination
  }
  return resolveFromAdtlsStore(opts)
}

export function buildRunContext(opts: CliOptions, destination: string): RunContext {
  return {
    destination,
    pattern: 'CL_ABAP*',
    importFrom: opts.importFrom,
    port: opts.port,
    timeoutMs: opts.timeoutMs,
  }
}
