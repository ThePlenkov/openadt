#!/usr/bin/env bun
/**
 * OpenADT MCP CLI — manage the unified mesh server.
 *
 *   adt-mcp serve [--http] [--port N] [--workspace DIR] [--no-lsp] [--no-proxy]
 *                 [--sap-port N [--sap-token T]] [--shared] [--destination ID]
 *   adt-mcp status [--port N] [--json]
 *   adt-mcp stop   [--port N] [--json]
 *   adt-mcp list   [--json]
 *   adt-mcp print-config [--port N] [--json]
 */
import {
  parseListArgv,
  parsePrintConfigArgv,
  parseServeArgv,
  parseStatusArgv,
  parseStopArgv,
} from '@openadt/adt-config'
import { locateAdtLs, findExtensionRoots, pickNewestExtension } from '@openadt/adt-infra'
import { runServe } from './server.js'
import { deriveDestinations, adtlsDestinationsStorePath } from './destinations.js'
import { mcpHttpClientConfig, probeMcpHttp } from './sap-mcp/control.js'
import {
  listEndpoints,
  readEndpoint,
  stopTrackedMcpServers,
  type McpEndpointRecord,
} from './endpoint-store.js'

const EXIT_OK = 0
const EXIT_ERROR = 1

async function cmdServe(argv: string[]): Promise<number> {
  return runServe(parseServeArgv(argv))
}

function resolveEndpoint(port: number | undefined): McpEndpointRecord | { error: string } {
  if (port !== undefined) {
    const record = readEndpoint(port)
    return (
      record ?? {
        error: `No active MCP endpoint on port ${port}. Run: adt-mcp serve --http --port ${port}`,
      }
    )
  }
  const active = listEndpoints()
  if (active.length === 0) {
    return { error: 'No active MCP endpoints. Run: adt-mcp serve' }
  }
  if (active.length === 1) {
    return active[0]!
  }
  const ports = active.map((e) => e.port).join(', ')
  return { error: `Multiple MCP endpoints active (ports ${ports}). Use --port <port>.` }
}

async function cmdStatus(argv: string[]): Promise<number> {
  const { port, json } = parseStatusArgv(argv)
  const endpoints = port !== undefined ? compact([readEndpoint(port)]) : listEndpoints()
  const rows = await Promise.all(
    endpoints.map(async (ep) => ({
      port: ep.port,
      url: ep.url,
      healthy: await probeMcpHttp(ep.port, ep.token),
      destinations: ep.destinations,
      mode: ep.mode ?? 'standalone',
    }))
  )
  if (json) {
    console.log(JSON.stringify(rows, null, 2))
  } else if (rows.length === 0) {
    console.error('No active MCP endpoints.')
  } else {
    for (const r of rows) {
      console.log(
        `${r.healthy ? 'OK  ' : 'DOWN'} port ${r.port} · ${r.url} · ${r.mode} · ${r.destinations.length} dest`
      )
    }
  }
  return rows.some((r) => r.healthy) || rows.length === 0 ? EXIT_OK : EXIT_ERROR
}

async function cmdStop(argv: string[]): Promise<number> {
  const { port, json } = parseStopArgv(argv)
  const stopped = await stopTrackedMcpServers({ onlyPort: port })
  if (json) {
    console.log(JSON.stringify({ stopped }, null, 2))
  } else {
    console.error(`[openadt-mcp] stopped ${stopped} process(es).`)
  }
  return EXIT_OK
}

async function cmdList(argv: string[]): Promise<number> {
  const { json } = parseListArgv(argv)
  const endpoints = listEndpoints()
  if (json) {
    console.log(JSON.stringify(endpoints, null, 2))
  } else if (endpoints.length === 0) {
    console.error('No active MCP endpoints.')
  } else {
    for (const ep of endpoints) {
      console.log(`port ${ep.port} · ${ep.url} · ${ep.mode ?? 'standalone'} · pid ${ep.pid}`)
    }
  }
  return EXIT_OK
}

async function cmdPrintConfig(argv: string[]): Promise<number> {
  const { port, json } = parsePrintConfigArgv(argv)
  const resolved = resolveEndpoint(port)
  if ('error' in resolved) {
    console.error(resolved.error)
    return EXIT_ERROR
  }
  const config = mcpHttpClientConfig(resolved.port, resolved.token)
  console.log(JSON.stringify(config, null, json ? 2 : 0))
  return EXIT_OK
}

async function cmdCheck(): Promise<number> {
  console.log('ADT LS Extension Detection')
  console.log('==========================\n')

  const override = process.env.ADT_LS_PATH
  if (override) {
    console.log(`ADT_LS_PATH override: ${override}\n`)
  }

  const allExtensions = findExtensionRoots()
  if (allExtensions.length === 0 && !override) {
    console.log('No ADT VS Code extensions found.')
    console.log('Install SAP ADT extension or set ADT_LS_PATH environment variable.')
    reportDestinations()
    return EXIT_OK
  }

  if (allExtensions.length > 0) {
    console.log(`Found ${allExtensions.length} extension(s):\n`)
    allExtensions.forEach((ext) => {
      console.log(`  - ${ext.path}`)
      console.log(`    Version: ${ext.version}`)
    })

    const newest = pickNewestExtension(allExtensions)
    if (newest) {
      console.log('\nSelected (newest):')
      console.log(`  Path: ${newest.path}`)
      console.log(`  Version: ${newest.version}`)
    }
  }

  const install = locateAdtLs()
  if (install) {
    console.log(`\nadt-lsc: ${install.adtLscPath}`)
  } else {
    console.log('\nadt-lsc: NOT FOUND (binary missing in extension)')
  }

  reportDestinations()
  return EXIT_OK
}

/** Print the destination store path and the destinations openadt would register. */
function reportDestinations(): void {
  console.log('\nDestinations')
  console.log('------------')
  const { ids } = deriveDestinations()
  console.log(`  Store: ${adtlsDestinationsStorePath()}`)
  if (ids.length === 0) {
    console.log('  (none — open a project in ADT or check ~/.adtls/destinations.json)')
    return
  }
  console.log(`  ${ids.length} destination(s): ${ids.join(', ')}`)
}

function compact<T>(items: (T | undefined)[]): T[] {
  return items.filter((x): x is T => x !== undefined)
}

function usage(): void {
  console.error('Usage: adt-mcp <command>')
  console.error('Commands:')
  console.error('  serve         Start the unified mesh MCP server (stdio; --http for web)')
  console.error('  status        Probe active MCP endpoint health')
  console.error('  stop          Stop tracked MCP backend(s)')
  console.error('  list          List active MCP endpoints')
  console.error('  print-config  Emit HTTP MCP client JSON (url + headers)')
  console.error('  check         Detect ADT LS extension version')
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  const command = argv[0]
  const rest = argv.slice(1)
  switch (command) {
    case 'serve':
      return cmdServe(rest)
    case 'status':
      return cmdStatus(rest)
    case 'stop':
      return cmdStop(rest)
    case 'list':
      return cmdList(rest)
    case 'print-config':
      return cmdPrintConfig(rest)
    case 'check':
      return cmdCheck()
    case undefined:
    case '--help':
    case '-h':
      usage()
      return command === undefined ? EXIT_ERROR : EXIT_OK
    default:
      console.error(`Unknown command: ${command}`)
      usage()
      return EXIT_ERROR
  }
}

main()
  .then((code) => process.exit(code))
  .catch((err: unknown) => {
    console.error(`[openadt-mcp] ${err instanceof Error ? err.message : String(err)}`)
    process.exit(EXIT_ERROR)
  })
