/**
 * Repo-root / agent stdio entry for the mesh MCP server.
 *
 * Invoked via `bun scripts/mcp-stdio.ts` (which imports this) from IDE / agent
 * MCP configs. Runs the mesh in-process over stdio in own mode (default), so a
 * single `adt-lsc` backs both the SAP `abap_*` and OpenADT `adt_*` tool groups.
 * The JCo / sapcrypto runtime env from `~/.openadt/local.openadt.toml` is applied
 * by `spawnAdtLsc` when the child starts — no wrapper process required.
 *
 * `OPENADT_MCP_PORT` pins the SAP backend port (otherwise the default is used).
 */
import { parseServeArgv } from '@openadt/adt-config'
import { runServe } from './server.js'

const PORT_MIN = 1024
const PORT_MAX = 65535

function isValidPort(value: number): boolean {
  return Number.isInteger(value) && value >= PORT_MIN && value <= PORT_MAX
}

function parseExplicitPort(raw: string | undefined): number | undefined {
  if (!raw) {
    return undefined
  }
  const port = Number(raw)
  if (!isValidPort(port)) {
    console.error(
      `[openadt-mcp] Invalid OPENADT_MCP_PORT=${raw} (expected ${PORT_MIN}-${PORT_MAX}); using default.`
    )
    return undefined
  }
  return port
}

const explicitPort = parseExplicitPort(process.env.OPENADT_MCP_PORT?.trim())
const argv = [
  '--stdio',
  ...(explicitPort !== undefined ? ['--port', String(explicitPort)] : []),
  ...process.argv.slice(2),
]

runServe(parseServeArgv(argv))
  .then((code) => process.exit(code))
  .catch((err: unknown) => {
    console.error(`[openadt-mcp] ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  })
