import { homedir } from 'node:os'
import { join } from 'node:path'
import {
  DEFAULT_IMPORT_FROM,
  DEFAULT_MCP_PORT,
  type DestinationImportMode,
  type McpServeConfig,
} from './types'
import { DEFAULT_LOGON_TIMEOUT_MS } from '@openadt/adt-lsp-client'

export const DEFAULT_WORKSPACE = join(homedir(), '.openadt', 'adt-ls-workspace')
export const PID_FILE = join(homedir(), '.openadt', 'adt-ls-mcp.pid')

export function parseServeArgv(argv: string[]): McpServeConfig {
  const state: ServeArgvState = {
    port: DEFAULT_MCP_PORT,
    explicitPort: false,
    workspace: DEFAULT_WORKSPACE,
    explicitWorkspace: false,
    importFrom: DEFAULT_IMPORT_FROM,
    destination: undefined,
    json: false,
    showToken: false,
    verbose: false,
    logFile: undefined,
    logonTimeoutMs: DEFAULT_LOGON_TIMEOUT_MS,
    stdio: false,
    http: false,
    standalone: false,
    restart: false,
    proxyMode: 'proxy',
    lsp: true,
    sapPort: undefined,
    sapToken: undefined,
    shared: false,
  }

  const handlers = buildServeArgvHandlers()
  for (let i = 0; i < argv.length; ) {
    const arg = argv[i]!
    const handler = handlers.find((h) => h.matches(arg))
    if (!handler) {
      throw new Error(`Unknown argument: ${arg}`)
    }
    i = handler.apply(arg, argv, i, state)
  }

  finalizeServeArgv(state)

  return state
}

type ServeArgvState = {
  port: number
  explicitPort: boolean
  workspace: string
  explicitWorkspace: boolean
  importFrom: DestinationImportMode
  destination: string | undefined
  json: boolean
  showToken: boolean
  verbose: boolean
  logFile: string | undefined
  logonTimeoutMs: number
  stdio: boolean
  /** When true, serve the mesh over HTTP (`--http`) instead of stdio. */
  http: boolean
  /** When true, --stdio is monolithic (own adt-lsc, kill on exit). */
  standalone: boolean
  /** When true (shared stdio), stop an existing daemon first so a fresh one spawns. */
  restart: boolean
  /** Proxy mode: 'proxy' serves SAP + custom tools, 'no-proxy' serves only custom tools. */
  proxyMode: 'proxy' | 'no-proxy'
  /** When true, include adt-lsp-mcp tools as additional MCP tools. */
  lsp: boolean
  /** Attach to an external SAP MCP HTTP server on this port instead of spawning adt-lsc. */
  sapPort: number | undefined
  /** Bearer token for the attached SAP MCP (`--sap-port`). */
  sapToken: string | undefined
  /** Use a shared detached daemon (find/spawn via endpoint store). */
  shared: boolean
}

type ServeArgvHandler = {
  matches: (arg: string) => boolean
  apply: (arg: string, argv: string[], i: number, state: ServeArgvState) => number
}

const IMPORT_FROM_MODES: readonly DestinationImportMode[] = [
  'auto',
  'adtls',
  'gui',
  'openadt',
  'none',
]

function buildServeArgvHandlers(): ServeArgvHandler[] {
  return [...importFromArgvHandlers(), ...booleanFlagArgvHandlers(), ...valuedArgvHandlers()]
}

function importFromArgvHandlers(): ServeArgvHandler[] {
  const setMode = (mode: DestinationImportMode) => (s: ServeArgvState) => {
    s.importFrom = mode
  }
  return [
    flag(setMode('gui'), ['--gui', '--import-from=gui']),
    flagValue(setMode('openadt'), ['--import-from=openadt']),
    flagValue(setMode('adtls'), ['--import-from=adtls']),
    flagValue(setMode('auto'), ['--import-from=auto']),
    flag(setMode('none'), ['--no-gui', '--import-from=none']),
    consumeNext(
      (_arg, argv, i, s) => {
        const value = argv[++i]!.toLowerCase()
        if (!IMPORT_FROM_MODES.includes(value as DestinationImportMode)) {
          throw new Error(
            `Invalid --import-from: ${value} (use auto, adtls, gui, openadt, or none)`
          )
        }
        s.importFrom = value as DestinationImportMode
        return i
      },
      ['--import-from']
    ),
  ]
}

function setJson(s: ServeArgvState): void {
  s.json = true
}
function setShowToken(s: ServeArgvState): void {
  s.showToken = true
}
function setStdio(s: ServeArgvState): void {
  s.stdio = true
}
function setHttp(s: ServeArgvState): void {
  s.http = true
}
function setShared(s: ServeArgvState): void {
  s.shared = true
}
function setStandalone(s: ServeArgvState): void {
  s.standalone = true
}
function setRestart(s: ServeArgvState): void {
  s.restart = true
}
function setVerbose(s: ServeArgvState): void {
  s.verbose = true
}
function setProxy(s: ServeArgvState): void {
  s.proxyMode = 'proxy'
}
function setNoProxy(s: ServeArgvState): void {
  s.proxyMode = 'no-proxy'
}
function setLsp(s: ServeArgvState): void {
  s.lsp = true
}
function unsetLsp(s: ServeArgvState): void {
  s.lsp = false
}

function booleanFlagArgvHandlers(): ServeArgvHandler[] {
  return [
    flag(setJson, ['--json']),
    flag(setShowToken, ['--show-token']),
    flag(setStdio, ['--stdio']),
    flag(setHttp, ['--http']),
    flag(setShared, ['--shared']),
    flag(setStandalone, ['--standalone']),
    flag(setRestart, ['--restart']),
    flag(setVerbose, ['--verbose', '-v']),
    flag(setProxy, ['--proxy']),
    flag(setNoProxy, ['--no-proxy']),
    flag(setLsp, ['--lsp']),
    flag(unsetLsp, ['--no-lsp']),
  ]
}

function valuedArgvHandlers(): ServeArgvHandler[] {
  return [
    stringValue(
      (_arg, value, s) => {
        s.logFile = value
      },
      ['--log-file']
    ),
    secondsValue(
      (_arg, value, s) => {
        s.logonTimeoutMs = value * 1000
      },
      ['--logon-timeout']
    ),
    numberValue(
      (_arg, value, s) => {
        s.port = value
        s.explicitPort = true
      },
      ['--port']
    ),
    numberValue(
      (_arg, value, s) => {
        s.sapPort = value
      },
      ['--sap-port']
    ),
    stringValue(
      (_arg, value, s) => {
        s.sapToken = value
      },
      ['--sap-token']
    ),
    stringValue(
      (_arg, value, s) => {
        s.workspace = value
        s.explicitWorkspace = true
      },
      ['--workspace']
    ),
    stringValue(
      (_arg, value, s) => {
        s.destination = value
      },
      ['--destination']
    ),
  ]
}

const MIN_LOGON_TIMEOUT_MS = 5_000

function validateServePorts(state: ServeArgvState): void {
  if (!isValidPort(state.port)) {
    throw new Error(`Invalid --port: ${state.port}`)
  }
  if (state.sapPort !== undefined && !isValidPort(state.sapPort)) {
    throw new Error(`Invalid --sap-port: ${state.sapPort}`)
  }
}

function validateLogonTimeout(state: ServeArgvState): void {
  if (Number.isFinite(state.logonTimeoutMs) && state.logonTimeoutMs >= MIN_LOGON_TIMEOUT_MS) return
  throw new Error(`Invalid --logon-timeout (seconds must be >= 5)`)
}

function applyDebugEnvOverride(state: ServeArgvState): void {
  if (!state.verbose && process.env.MCP_DEBUG) {
    state.verbose = true
  }
}

function finalizeServeArgv(state: ServeArgvState): void {
  validateServePorts(state)
  validateLogonTimeout(state)
  applyDebugEnvOverride(state)
}

function flag(apply: (state: ServeArgvState) => void, forms: readonly string[]): ServeArgvHandler {
  return {
    matches: (arg) => forms.includes(arg),
    apply: (arg, _argv, i, state) => {
      apply(state)
      return i + 1
    },
  }
}

function flagValue(
  apply: (state: ServeArgvState) => void,
  forms: readonly string[]
): ServeArgvHandler {
  return {
    matches: (arg) => forms.some((form) => arg === form || arg.startsWith(`${form}=`)),
    apply: (arg, _argv, i, state) => {
      apply(state)
      return i + 1
    },
  }
}

function consumeNext(
  apply: (arg: string, argv: string[], i: number, state: ServeArgvState) => number,
  forms: readonly string[]
): ServeArgvHandler {
  return {
    matches: (arg) => forms.includes(arg),
    apply: (arg, argv, i, state) => apply(arg, argv, i, state) + 1,
  }
}

function stringValue(
  apply: (arg: string, value: string, state: ServeArgvState) => void,
  forms: readonly string[]
): ServeArgvHandler {
  const eqForm = `${forms[0]}=`
  return {
    matches: (arg) => arg === forms[0] || arg.startsWith(eqForm),
    apply: (arg, argv, i, state) => {
      const value = arg.startsWith(eqForm) ? arg.slice(eqForm.length) : argv[++i]!
      apply(arg, value, state)
      return i + 1
    },
  }
}

function numberValue(
  apply: (arg: string, value: number, state: ServeArgvState) => void,
  forms: readonly string[]
): ServeArgvHandler {
  const eqForm = `${forms[0]}=`
  return {
    matches: (arg) => arg === forms[0] || arg.startsWith(eqForm),
    apply: (arg, argv, i, state) => {
      const raw = arg.startsWith(eqForm) ? arg.slice(eqForm.length) : argv[++i]!
      apply(arg, Number(raw), state)
      return i + 1
    },
  }
}

function secondsValue(
  apply: (arg: string, value: number, state: ServeArgvState) => void,
  forms: readonly string[]
): ServeArgvHandler {
  return numberValue(apply, forms)
}

function isValidPort(value: number): boolean {
  return Number.isFinite(value) && value >= 1 && value <= 65535
}

/** Read `--port` / `--port=N` from argv, or undefined if absent. */
function readPortFlag(request: {
  argv: string[]
  i: number
}): { value: number; next: number } | undefined {
  const arg = request.argv[request.i]!
  if (arg === '--port' && request.i + 1 < request.argv.length) {
    return { value: Number(request.argv[request.i + 1]), next: request.i + 2 }
  }
  if (arg.startsWith('--port=')) {
    return {
      value: Number(arg.slice('--port='.length)),
      next: request.i + 1,
    }
  }
  return undefined
}

function isJsonFlag(arg: string): boolean {
  return arg === '--json'
}

export function parseStatusArgv(argv: string[]): {
  port?: number
  token?: string
  json: boolean
} {
  let token: string | undefined
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!
    if (arg === '--token' && i + 1 < argv.length) {
      token = argv[++i]
      continue
    }
    if (arg.startsWith('--token=')) {
      token = arg.slice('--token='.length)
      continue
    }
  }
  const { port, json } = parsePortAndJson(argv)
  return { port, token, json }
}

export function parsePrintConfigArgv(argv: string[]): {
  port?: number
  json: boolean
} {
  return parsePortAndJson(argv)
}

export function parseListArgv(argv: string[]): { json: boolean } {
  return { json: argv.includes('--json') }
}

export function parseStopArgv(argv: string[]): {
  port?: number
  json: boolean
} {
  return parsePortAndJson(argv)
}

export function parseBridgeArgv(argv: string[]): {
  port?: number
  stdio: boolean
  json: boolean
} {
  let stdio = false
  for (const arg of argv) {
    if (arg === '--stdio') {
      stdio = true
    }
  }
  const { port, json } = parsePortAndJson(argv)
  return { port, stdio, json }
}

function parsePortAndJson(argv: string[]): { port?: number; json: boolean } {
  let port: number | undefined
  let json = false
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!
    if (isJsonFlag(arg)) {
      json = true
      continue
    }
    const portFlag = readPortFlag({ argv, i })
    if (portFlag) {
      port = portFlag.value
      i = portFlag.next - 1
    }
  }
  if (port !== undefined && !isValidPort(port)) {
    throw new Error(`Invalid --port: ${port}`)
  }
  return { port, json }
}

export interface ParsedSubcommand {
  readonly name: string
  readonly argv: string[]
}

export function parseSubcommandArgv(argv: string[]): ParsedSubcommand | undefined {
  const sub = argv[0]
  if (!sub) return undefined
  if (sub === '--help' || sub === '-h') return undefined
  return { name: sub, argv: argv.slice(1) }
}
