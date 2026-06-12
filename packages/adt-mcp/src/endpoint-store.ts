/**
 * MCP endpoint store: `~/.openadt/mcp/endpoints/<port>.json`.
 *
 * One record per running SAP HTTP MCP backend (url, token, pids, destinations).
 * Backs `status` / `list` / `stop` and shared-daemon discovery. Records are
 * pruned when their owning pid is dead. Ported from the launcher in `main`.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { killProcessByPid, sleep, waitForProcessExit } from '@openadt/adt-infra'
import { probeMcpHttp } from './sap-mcp/control.js'

/** Mode tag for endpoint records. */
export type McpEndpointMode = 'daemon' | 'standalone'

export type McpEndpointRecord = {
  port: number
  url: string
  token: string
  /** `adt-mcp serve` process pid. */
  pid: number
  adtLscPid?: number
  startedAt: string
  destination?: string
  destinations: string[]
  workspace: string
  /** daemon = shared backend; standalone = owned lifecycle. */
  mode?: McpEndpointMode
}

export function mcpEndpointsDir(): string {
  return process.env.OPENADT_MCP_ENDPOINTS_DIR ?? join(homedir(), '.openadt', 'mcp', 'endpoints')
}

export function endpointFilePath(port: number): string {
  return join(mcpEndpointsDir(), `${port}.json`)
}

export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    const code = (err as NodeJS.ErrnoException | undefined)?.code
    // ESRCH: no such process. EPERM: exists but not signalable — treat as alive.
    return code === 'EPERM'
  }
}

export function writeEndpoint(record: McpEndpointRecord): void {
  mkdirSync(mcpEndpointsDir(), { recursive: true })
  writeFileSync(endpointFilePath(record.port), `${JSON.stringify(record, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  })
}

export function removeEndpoint(port: number): void {
  try {
    unlinkSync(endpointFilePath(port))
  } catch {
    /* absent */
  }
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((d) => typeof d === 'string')
}

function isValidPort(value: unknown): value is number {
  return isPositiveInteger(value) && value >= 1 && value <= 65535
}

function isValidEndpoint(r: Partial<McpEndpointRecord>): r is McpEndpointRecord {
  return (
    isValidPort(r.port) &&
    isNonEmptyString(r.url) &&
    isNonEmptyString(r.token) &&
    isPositiveInteger(r.pid) &&
    isStringArray(r.destinations) &&
    isNonEmptyString(r.workspace) &&
    isNonEmptyString(r.startedAt)
  )
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function parseEndpoint(raw: string): McpEndpointRecord | undefined {
  let record: unknown
  try {
    record = JSON.parse(raw)
  } catch {
    return undefined
  }
  if (!isJsonObject(record)) {
    return undefined
  }
  const r = record as Partial<McpEndpointRecord>
  return isValidEndpoint(r) ? r : undefined
}

export function readEndpoint(
  port: number,
  options?: { pruneStale?: boolean }
): McpEndpointRecord | undefined {
  const pruneStale = options?.pruneStale ?? true
  const path = endpointFilePath(port)
  if (!existsSync(path)) {
    return undefined
  }
  try {
    const record = parseEndpoint(readFileSync(path, 'utf8'))
    if (!record) {
      if (pruneStale) {
        removeEndpoint(port)
      }
      return undefined
    }
    if (pruneStale && !isProcessAlive(record.pid)) {
      removeEndpoint(port)
      return undefined
    }
    return record
  } catch {
    if (pruneStale) {
      removeEndpoint(port)
    }
    return undefined
  }
}

export function listEndpoints(): McpEndpointRecord[] {
  const dir = mcpEndpointsDir()
  if (!existsSync(dir)) {
    return []
  }
  const out: McpEndpointRecord[] = []
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.json')) {
      continue
    }
    const port = Number.parseInt(name.slice(0, -'.json'.length), 10)
    if (!Number.isFinite(port)) {
      continue
    }
    const record = readEndpoint(port)
    if (record) {
      out.push(record)
    }
  }
  return out.sort((a, b) => a.port - b.port)
}

export type FindHealthyEndpointResult =
  | { status: 'none' }
  | { status: 'one'; record: McpEndpointRecord }
  | { status: 'ambiguous'; records: McpEndpointRecord[] }
  | { status: 'unhealthy' }

/** Find the single healthy endpoint in the store, probing HTTP. */
export async function findHealthyEndpoint(
  preferredPort?: number
): Promise<FindHealthyEndpointResult> {
  const endpoints = listEndpoints()
  if (endpoints.length === 0) {
    return { status: 'none' }
  }
  const healthy: McpEndpointRecord[] = []
  for (const record of endpoints) {
    if (await isCandidateHealthy(record, preferredPort)) {
      healthy.push(record)
    }
  }
  if (healthy.length === 0) {
    return { status: 'unhealthy' }
  }
  if (healthy.length === 1) {
    return { status: 'one', record: healthy[0]! }
  }
  return { status: 'ambiguous', records: healthy }
}

async function isCandidateHealthy(
  record: McpEndpointRecord,
  preferredPort: number | undefined
): Promise<boolean> {
  if (preferredPort !== undefined && record.port !== preferredPort) {
    return false
  }
  if (!isProcessAlive(record.pid)) {
    return false
  }
  return probeMcpHttp(record.port, record.token)
}

/** Stop prior `adt-mcp serve` instances tracked in the endpoint store. */
export async function stopTrackedMcpServers(options: { onlyPort?: number } = {}): Promise<number> {
  const endpoints = listEndpoints()
  const scoped = options.onlyPort
    ? endpoints.filter((ep) => ep.port === options.onlyPort)
    : endpoints
  const pids = new Set<number>()
  for (const ep of scoped) {
    pids.add(ep.pid)
    if (ep.adtLscPid) {
      pids.add(ep.adtLscPid)
    }
  }
  let stopped = 0
  for (const pid of pids) {
    if (!isProcessAlive(pid)) {
      continue
    }
    killProcessByPid(pid)
    stopped++
  }
  await Promise.all([...pids].map((pid) => waitForProcessExit(pid, 8_000)))
  if (stopped > 0) {
    await sleep(1_000)
  }
  // Remove records only after the pids exited, so a failed kill never leaves a
  // live server with no store entry (would leak the process and its port).
  for (const ep of scoped) {
    removeEndpoint(ep.port)
  }
  return stopped
}
