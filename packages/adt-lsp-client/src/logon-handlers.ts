import { spawn } from 'node:child_process'
import * as readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import type { MessageConnection } from '@openadt/adt-infra'
import type { McpLog } from '@openadt/adt-infra'
import {
  LSP_METHOD_DESTINATIONS_LOGON_STATE_CHANGED,
  LSP_METHOD_DESTINATIONS_REQUEST_BROWSER_LOGON,
  LSP_METHOD_DESTINATIONS_REQUEST_LOGON_INPUT,
  LSP_METHOD_DESTINATIONS_STOP_LOGON,
} from '@openadt/adt-config'

export const DEFAULT_LOGON_TIMEOUT_MS = 300_000

export type RequestBrowserBasedLogonParams = {
  id: string
  title?: string
  params?: Array<{ field?: { value?: string } }>
}

export type RequestLogonInputParams = {
  id: string
  title?: string
  params?: Array<{
    description?: string
    label?: string
    sensitive?: boolean
    field?: { key?: string }
  }>
}

export type LogonStateChangedParams = {
  destinationId: string
  logonState: string
  server?: string
  user?: string
  message?: string
}

let lastLogonFailureMessage: string | undefined

function extractBrowserUrl(params: RequestBrowserBasedLogonParams): string | undefined {
  return params.params?.[0]?.field?.value
}

async function handleBrowserLogonRequest(
  connection: MessageConnection,
  params: RequestBrowserBasedLogonParams,
  log: McpLog | undefined
): Promise<boolean> {
  const url = extractBrowserUrl(params)
  log?.info(`SAP logon: opening browser (${params.title ?? params.id})`)
  console.error('[openadt-mcp] SAP logon: opening browser — complete sign-in if prompted.')
  if (!isHttpUrl(url)) {
    log?.warn(
      url ? `requestBrowserBasedLogon: invalid URL ${url}` : 'requestBrowserBasedLogon: missing URL'
    )
    return false
  }
  log?.info(`browser URL: ${url}`)
  openDefaultBrowser(url)
  return true
}

function isHttpUrl(url: string | undefined): url is string {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

async function handleLogonInputRequest(
  connection: MessageConnection,
  params: RequestLogonInputParams,
  log: McpLog | undefined
): Promise<{ id: string; fields: Array<{ key: string; value: string }> } | undefined> {
  const field = params.params?.[0]
  if (!field?.field?.key) {
    log?.warn('requestLogonInput: missing field')
    return undefined
  }
  log?.info(`SAP logon: terminal input (${params.title ?? params.id})`)
  const value = await promptLogonInputTerminal(
    params.title ?? 'SAP logon',
    field.description ?? field.label ?? 'Enter value',
    Boolean(field.sensitive)
  )
  if (!value) {
    await connection.sendRequest(LSP_METHOD_DESTINATIONS_STOP_LOGON, {
      destinationId: params.id,
      cancel: true,
    })
    return undefined
  }
  return {
    id: params.id,
    fields: [{ key: field.field.key, value }],
  }
}

function handleShowMessage(
  params: { message?: string; type?: number },
  log: McpLog | undefined
): undefined {
  const text = params.message ?? ''
  log?.info(`SAP message: ${text}`)
  console.error(`[openadt-mcp] SAP: ${text}`)
  return undefined
}

function handleWorkspaceConfiguration(params: { items?: Array<{ section?: string }> }): null[] {
  const count = params.items?.length ?? 0
  return Array.from({ length: count }, () => null)
}

function handleLogonStateChanged(params: LogonStateChangedParams, log: McpLog | undefined): void {
  log?.info(
    `logon ${params.destinationId}: ${params.logonState}` +
      (params.message ? ` — ${params.message}` : '')
  )
  if (params.logonState === 'pending') {
    console.error(
      `[openadt-mcp] Logon pending for ${params.destinationId} — complete SSO or Secure Login if a window opened.`
    )
    return
  }
  if (params.logonState === 'disconnected' || params.logonState === 'cancelled') {
    lastLogonFailureMessage = params.message
  }
}

/** Register SAP server→client logon handlers (same contract as VS Code extension). */
export function registerLogonHandlers(connection: MessageConnection, log?: McpLog): void {
  connection.onRequest(LSP_METHOD_DESTINATIONS_REQUEST_BROWSER_LOGON, (params) =>
    handleBrowserLogonRequest(connection, params, log)
  )
  connection.onRequest(LSP_METHOD_DESTINATIONS_REQUEST_LOGON_INPUT, (params) =>
    handleLogonInputRequest(connection, params, log)
  )
  connection.onRequest('window/showMessage', (params) => handleShowMessage(params, log))
  connection.onRequest('workspace/configuration', handleWorkspaceConfiguration)
  connection.onNotification(LSP_METHOD_DESTINATIONS_LOGON_STATE_CHANGED, (params) =>
    handleLogonStateChanged(params, log)
  )
}

export function openDefaultBrowser(url: string): void {
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    }).unref()
    return
  }
  if (process.platform === 'darwin') {
    spawn('open', [url], { detached: true, stdio: 'ignore' }).unref()
    return
  }
  spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref()
}

async function promptLogonInputTerminal(
  title: string,
  prompt: string,
  sensitive: boolean
): Promise<string | undefined> {
  console.error(`\n[openadt-mcp] ${title}`)
  console.error(prompt)
  if (sensitive) {
    console.error(
      '(input visible in terminal — use Secure Login / browser SSO when offered instead)'
    )
  }
  if (!stdin.isTTY) {
    console.error('[openadt-mcp] Cannot prompt: stdin is not a TTY.')
    return undefined
  }
  const rl = readline.createInterface({
    input: stdin,
    output: sensitive ? undefined : stdout,
    terminal: sensitive,
  })
  try {
    const answer = await rl.question(sensitive ? 'Value: ' : '> ')
    const trimmed = answer.trim()
    return trimmed || undefined
  } finally {
    rl.close()
  }
}

export async function getLogonState(
  connection: MessageConnection,
  destinationId: string
): Promise<string | undefined> {
  try {
    const info = (await connection.sendRequest('adtLs/destinations/getLogonInfo', destinationId)) as
      | { logonState?: string }
      | undefined
    return info?.logonState
  } catch {
    return undefined
  }
}

function buildLogonDidNotCompleteMessage(
  destinationId: string,
  state: string | undefined,
  err: unknown
): Error {
  return new Error(
    `Logon to ${destinationId} did not complete (${state ?? 'unknown'}): ${formatError(err)}`
  )
}

function buildLogonTimeoutMessage(destinationId: string, state: string | undefined): Error {
  const detail = lastLogonFailureMessage ?? state ?? 'unknown'
  return new Error(
    `Logon to ${destinationId} did not reach 'connected' (${detail}). ` +
      'Approve Secure Login / SSO if prompted. If this repeats: run with --verbose, ' +
      'stop stale adt-lsc (pkill adt-lsc on macOS/Linux, Get-Process adt-lsc | Stop-Process -Force on Windows), ' +
      'check ~/.openadt/local.openadt.toml jco_native_dir/sapcrypto.'
  )
}

async function awaitEnsureLoggedOnResponse(
  connection: MessageConnection,
  destinationId: string,
  timeoutMs: number,
  log: McpLog | undefined
): Promise<string | undefined> {
  try {
    await withTimeout(
      connection.sendRequest('adtLs/destinations/ensureLoggedOn', destinationId),
      timeoutMs,
      'adtLs/destinations/ensureLoggedOn'
    )
    log?.info(`LSP ← ensureLoggedOn ${destinationId} ok`)
    return undefined
  } catch (err) {
    const state = await getLogonState(connection, destinationId)
    if (state === 'connected') {
      log?.info(`ensureLoggedOn timed out but logonState=connected`)
      return undefined
    }
    throw buildLogonDidNotCompleteMessage(destinationId, state, err)
  }
}

function announceLogonStart(
  destinationId: string,
  timeoutMs: number,
  log: McpLog | undefined
): void {
  lastLogonFailureMessage = undefined
  console.error(
    `[openadt-mcp] Starting SAP logon for ${destinationId} — approve SSO / Secure Login if a window opens (timeout ${Math.round(timeoutMs / 1000)}s).`
  )
  log?.info(`LSP → adtLs/destinations/ensureLoggedOn ${destinationId}`)
}

export async function ensureDestinationLoggedOn(
  connection: MessageConnection,
  destinationId: string,
  options: { timeoutMs: number; log?: McpLog }
): Promise<void> {
  const { timeoutMs, log } = options
  announceLogonStart(destinationId, timeoutMs, log)
  await awaitEnsureLoggedOnResponse(connection, destinationId, timeoutMs, log)
  const state = await getLogonState(connection, destinationId)
  if (state !== 'connected') {
    throw buildLogonTimeoutMessage(destinationId, state)
  }
}

function formatError(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    promise.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      }
    )
  })
}
