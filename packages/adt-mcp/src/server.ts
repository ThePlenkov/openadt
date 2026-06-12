#!/usr/bin/env bun
/**
 * Mesh serve orchestration.
 *
 * Resolves the SAP source (own / attach / shared), enumerates the SAP tool
 * group, builds the {@link MeshMcpServer}, and runs the chosen transport
 * (stdio by default, HTTP on `--http`). Owns process-signal teardown so an
 * owned `adt-lsc` never outlives the launcher.
 */
import type { McpServeConfig } from '@openadt/adt-config'
import { resolveSapSource, type SapSource } from './sap-mcp/source.js'
import { generateMcpToken } from './sap-mcp/control.js'
import { collectSapTools, MeshMcpServer } from './mesh-server.js'
import { serveStdio } from './transport/stdio.js'
import { serveHttp, type HttpHandle } from './transport/http.js'

const EXIT_OK = 0
const EXIT_ERROR = 1

export async function runServe(cfg: McpServeConfig): Promise<number> {
  // When serving HTTP in own mode, the mesh listens on cfg.port; the owned SAP
  // backend must bind a different port to avoid a collision.
  const ownBackendPort = cfg.http ? cfg.port + 1 : cfg.port

  let source: SapSource
  try {
    source = await resolveSapSource(cfg, { ownBackendPort })
  } catch (err) {
    console.error(`[openadt-mcp] ${err instanceof Error ? err.message : String(err)}`)
    return EXIT_ERROR
  }

  if (cfg.lsp && !source.session) {
    console.error(
      '[openadt-mcp] --lsp requested but no owned LSP session (attach/shared mode) — adt_* tools unavailable.'
    )
  }

  const sapTools = await collectSapTools(source)
  const server = new MeshMcpServer({ cfg, source, sapTools })

  const toolCount = server.listTools().length
  if (toolCount === 0) {
    console.error(
      '[openadt-mcp] WARNING: no tools available (check --no-proxy / --no-lsp / SAP backend).'
    )
  } else {
    console.error(`[openadt-mcp] mesh exposing ${toolCount} tool(s)`)
  }

  return cfg.http ? runHttp(cfg, server, source) : runStdio(server, source)
}

async function runStdio(server: MeshMcpServer, source: SapSource): Promise<number> {
  const handle = serveStdio(server)
  installSignalHandlers(source, undefined)
  await handle.closed
  await source.shutdown()
  return EXIT_OK
}

async function runHttp(
  cfg: McpServeConfig,
  server: MeshMcpServer,
  source: SapSource
): Promise<number> {
  const token = generateMcpToken()
  let http: HttpHandle
  try {
    http = await serveHttp(server, { port: cfg.port, token })
  } catch (err) {
    console.error(`[openadt-mcp] HTTP listen on ${cfg.port} failed: ${String(err)}`)
    await source.shutdown()
    return EXIT_ERROR
  }
  if (cfg.showToken) {
    console.error(`[openadt-mcp] Bearer token: ${token}`)
  } else {
    console.error(
      '[openadt-mcp] Bearer token withheld (use --show-token or `adt-mcp print-config`).'
    )
  }
  installSignalHandlers(source, http)
  // Hold until a signal triggers shutdown.
  await new Promise<void>(() => {})
  return EXIT_OK
}

function installSignalHandlers(source: SapSource, http: HttpHandle | undefined): void {
  let done = false
  const shutdown = (): void => {
    if (done) {
      return
    }
    done = true
    void (async () => {
      try {
        if (http) {
          await http.close()
        }
        await source.shutdown()
      } finally {
        process.exit(EXIT_OK)
      }
    })()
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}
