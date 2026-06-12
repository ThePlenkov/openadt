/**
 * Own-mode backend lifecycle.
 *
 * Spawns and supervises our own `adt-lsc`: LSP handshake (with destinations
 * registered from the ADT LS store), `startMCPServer`, HTTP readiness wait, and
 * endpoint-store bookkeeping. The returned session's `connection` is reused
 * in-process for the `adt_*` LSP tool group, so one child backs both tool
 * groups. `shutdown()` tears the child down and removes the store record.
 */
import { createMcpLog, killProcessTree, locateAdtLs } from '@openadt/adt-infra'
import { connectAdtLanguageServer, type LspSession } from '@openadt/adt-lsp-client'
import type { McpServeConfig } from '@openadt/adt-config'
import { deriveDestinations } from './destinations.js'
import { writeEndpoint, removeEndpoint, type McpEndpointMode } from './endpoint-store.js'
import {
  generateMcpToken,
  setMcpDestination,
  startMcpServer,
  stopMcpServer,
  waitForMcpHttp,
  mcpUrl,
  isPortInUseMessage,
} from './sap-mcp/control.js'

export type OwnBackend = {
  session: LspSession
  port: number
  token: string
  destinations: string[]
  shutdown: () => Promise<void>
}

/**
 * Start an owned SAP HTTP MCP backend.
 *
 * @throws if the SAP ADT VS Code extension / `adt-lsc` cannot be located, or the
 *   LSP handshake / `startMCPServer` / HTTP readiness wait fails.
 */
export async function startOwnBackend(
  cfg: McpServeConfig,
  options: { mode?: McpEndpointMode; port?: number } = {}
): Promise<OwnBackend> {
  const install = locateAdtLs()
  if (!install) {
    throw new Error(
      'SAP ADT VS Code extension not found (sapse.adt-vscode). Install it from the marketplace or set ADT_LS_PATH.'
    )
  }

  const { storePath, ids } = deriveDestinations()
  const log = createMcpLog({ verbose: cfg.verbose, logFile: cfg.logFile })
  const backendPort = options.port ?? cfg.port

  console.error(
    `[openadt-mcp] adt-lsc ${install.version} · workspace ${cfg.workspace} · ${ids.length} destination(s)`
  )

  // Set the first destination as default for abap_list_destinations.
  const defaultDestination = cfg.destination ?? ids[0]

  const session = await connectAdtLanguageServer(install, cfg.workspace, {
    destinationsStorePath: storePath,
    createProjectIds: ids,
    // Pre-logon the default destination so abap_list_destinations works.
    // Do not logon all destinations (would pop many SSO prompts).
    ensureLoggedOnIds: defaultDestination ? [defaultDestination] : [],
    logonTimeoutMs: cfg.logonTimeoutMs,
    log,
  })

  const token = generateMcpToken()
  const MAX_ATTEMPTS = 32
  const MAX_PORT = 65535
  let lastError: Error | undefined
  let started: { port: number; token: string }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const port = Math.min(backendPort + attempt, MAX_PORT)
    try {
      started = await startMcpServer(session.connection, { port, token })
      break
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (!isPortInUseMessage(lastError.message)) {
        throw lastError
      }
      if (attempt === MAX_ATTEMPTS - 1) {
        throw new Error(
          `Port ${backendPort} already in use; auto-increment failed after ${MAX_ATTEMPTS} attempts (up to port ${MAX_PORT})`
        )
      }
      console.error(`[openadt-mcp] port ${port} in use, trying ${port + 1}...`)
    }
  }

  const ready = await waitForMcpHttp(started.port, started.token)
  if (!ready) {
    await safeStop(session)
    throw new Error(`SAP HTTP MCP did not become ready on port ${started.port}`)
  }

  // Set the default destination so abap_list_destinations works.
  if (defaultDestination) {
    await setMcpDestination(session.connection, defaultDestination).catch((err: unknown) => {
      console.error(`[openadt-mcp] setDestination(${defaultDestination}) failed: ${String(err)}`)
    })
  }

  writeEndpoint({
    port: started.port,
    url: mcpUrl(started.port),
    token: started.token,
    pid: process.pid,
    adtLscPid: session.child.pid,
    startedAt: new Date().toISOString(),
    destination: cfg.destination,
    destinations: ids,
    workspace: cfg.workspace,
    mode: options.mode ?? 'standalone',
  })

  let stopped = false
  const shutdown = async (): Promise<void> => {
    if (stopped) {
      return
    }
    stopped = true
    await safeStop(session)
    removeEndpoint(started.port)
  }

  return { session, port: started.port, token: started.token, destinations: ids, shutdown }
}

async function safeStop(session: LspSession): Promise<void> {
  try {
    await stopMcpServer(session.connection)
  } catch {
    /* best effort */
  }
  try {
    session.connection.dispose()
  } catch {
    /* already disposed */
  }
  killProcessTree(session.child)
}
