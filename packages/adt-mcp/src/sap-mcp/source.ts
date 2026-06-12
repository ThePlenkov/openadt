/**
 * SAP source resolution — the three modes the mesh can get `abap_*` tools from:
 *
 *  - **own** (default): spawn our own `adt-lsc` (`startOwnBackend`). Yields both
 *    a SAP HTTP client *and* an LSP session, so `adt_*` tools can run in-process.
 *  - **attach** (`--sap-port [--sap-token]`): talk to an already-running / handed-out
 *    SAP MCP HTTP server. SAP tools only; no LSP session.
 *  - **shared** (`--shared`): reuse a healthy endpoint from the store; fall back to
 *    spawning our own (recorded as a `daemon`) when none is healthy.
 *
 * `session` is non-null only in own mode (and shared-fallback-to-own), which is
 * why `adt_*` tools are own-mode-only.
 */
import type { McpServeConfig } from '@openadt/adt-config'
import type { LspSession } from '@openadt/adt-lsp-client'
import { SapHttpMcpClient } from './client.js'
import { startOwnBackend } from '../lifecycle.js'
import { findHealthyEndpoint, readEndpoint } from '../endpoint-store.js'

export type SapSource = {
  /** SAP HTTP MCP client, or null when `--no-proxy` (SAP group disabled). */
  client: SapHttpMcpClient | null
  /** LSP session for in-process `adt_*` tools; null in attach/shared mode. */
  session: LspSession | null
  port: number | null
  token: string | null
  ownsChild: boolean
  shutdown: () => Promise<void>
}

const NOOP_SHUTDOWN = async (): Promise<void> => {}

export type ResolveSapSourceOptions = {
  /** Port the owned SAP backend should bind (own/shared-fallback modes). */
  ownBackendPort?: number
}

export async function resolveSapSource(
  cfg: McpServeConfig,
  options: ResolveSapSourceOptions = {}
): Promise<SapSource> {
  if (cfg.sapPort !== undefined) {
    return resolveAttach(cfg)
  }
  if (cfg.shared) {
    return resolveShared(cfg, options)
  }
  return resolveOwn(cfg, 'standalone', options)
}

function resolveAttach(cfg: McpServeConfig): SapSource {
  const port = cfg.sapPort!
  const token = cfg.sapToken ?? readEndpoint(port)?.token
  if (!token) {
    throw new Error(
      `--sap-port ${port}: no Bearer token. Pass --sap-token, or run a serve that records ~/.openadt/mcp/endpoints/${port}.json.`
    )
  }
  console.error(`[openadt-mcp] attaching to SAP MCP on port ${port} (SAP tools only)`)
  return {
    client: cfg.proxyMode === 'proxy' ? new SapHttpMcpClient(port, token) : null,
    session: null,
    port,
    token,
    ownsChild: false,
    shutdown: NOOP_SHUTDOWN,
  }
}

async function resolveShared(
  cfg: McpServeConfig,
  options: ResolveSapSourceOptions
): Promise<SapSource> {
  const found = await findHealthyEndpoint(cfg.explicitPort ? cfg.port : undefined)
  if (found.status === 'one') {
    const { port, token } = found.record
    console.error(`[openadt-mcp] using shared SAP MCP daemon on port ${port} (SAP tools only)`)
    return {
      client: cfg.proxyMode === 'proxy' ? new SapHttpMcpClient(port, token) : null,
      session: null,
      port,
      token,
      ownsChild: false,
      shutdown: NOOP_SHUTDOWN,
    }
  }
  if (found.status === 'ambiguous') {
    const ports = found.records.map((r) => r.port).join(', ')
    throw new Error(
      `Multiple healthy SAP MCP daemons (ports ${ports}). Disambiguate with --sap-port <port>.`
    )
  }
  console.error('[openadt-mcp] no healthy shared daemon; spawning our own (recorded as daemon)')
  return resolveOwn(cfg, 'daemon', options)
}

async function resolveOwn(
  cfg: McpServeConfig,
  mode: 'standalone' | 'daemon',
  options: ResolveSapSourceOptions
): Promise<SapSource> {
  const own = await startOwnBackend(cfg, { mode, port: options.ownBackendPort })
  return {
    client: cfg.proxyMode === 'proxy' ? new SapHttpMcpClient(own.port, own.token) : null,
    session: own.session,
    port: own.port,
    token: own.token,
    ownsChild: true,
    shutdown: own.shutdown,
  }
}
