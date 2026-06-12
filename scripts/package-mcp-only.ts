#!/usr/bin/env bun
/**
 * Package only the openadt-mcp binary (without the Java jar).
 * Used in CI for non-Windows platforms where we don't build the Java jar.
 *
 * Usage:
 *   bun scripts/package-mcp-only.ts --version=<version> --platform=<platform>
 *
 * Where <platform> is one of: win-x64, linux-x64, darwin-arm64, darwin-x64.
 */
import { packageMcpBinary } from '../tools/package-release/src/mcp-package.ts'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const versionArg = process.argv.find((a) => a.startsWith('--version='))?.split('=')[1]
const platformArg = process.argv.find((a) => a.startsWith('--platform='))?.split('=')[1]

if (!versionArg) {
  throw new Error('--version is required')
}

if (!platformArg) {
  throw new Error('--platform is required')
}

const root = resolve(import.meta.dir, '..')
process.env.OPENADT_MATRIX_PLATFORM = platformArg

packageMcpBinary({
  root,
  distDir: 'packaging/dist',
  version: versionArg,
  sha256File: (f) =>
    createHash('sha256').update(readFileSync(f.filePath)).digest('hex').toLowerCase(),
})
