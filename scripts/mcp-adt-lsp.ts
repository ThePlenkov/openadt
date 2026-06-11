#!/usr/bin/env bun
/**
 * Repo-root stdio MCP entry for @openadt/adt-lsp-mcp (direct LSP, 26 adt_* tools).
 * Single-process entry (no nested spawn) — safe for MCP Inspector proxy on Windows.
 *
 * Invoked as: bun scripts/mcp-adt-lsp.ts [destination]
 * Or: bun run mcp:adt-lsp -- [destination]
 */
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

function resolveRepoRoot(): string {
  for (const key of ['OPENADT_DEV_ROOT', 'OPENADT_REPO'] as const) {
    const raw = process.env[key]?.trim()
    if (raw && existsSync(join(raw, 'package.json'))) {
      return raw
    }
  }
  return root
}

function ensureDestinationArgv(): void {
  const fromArgv = process.argv.slice(2).find((a) => !a.startsWith('-'))
  const destination =
    fromArgv ??
    process.env.OPENADT_MCP_DESTINATION?.trim() ??
    process.env.OPENADT_DESTINATION?.trim()
  if (destination && !process.argv.includes(destination)) {
    process.argv.push(destination)
  }
}

const repoRoot = resolveRepoRoot()
process.chdir(repoRoot)
ensureDestinationArgv()

const built = join(repoRoot, 'tools', 'adt-lsp-mcp', 'dist', 'main.mjs')
const entry = existsSync(built) ? built : join(repoRoot, 'tools', 'adt-lsp-mcp', 'src', 'main.ts')

await import(entry)
