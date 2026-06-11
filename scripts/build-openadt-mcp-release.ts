#!/usr/bin/env bun
/**
 * Build the `openadt-mcp` standalone binary for one matrix platform.
 *
 * Usage:
 *   bun scripts/build-openadt-mcp-release.ts --platform=<platform> [--out=<dir>]
 *
 * Where <platform> is one of: win-x64, linux-x64, darwin-arm64, darwin-x64.
 *
 * Output layout under <dir>:
 *   openadt-mcp[.exe]      compiled Bun binary
 *   LICENSE                 copy of repo LICENSE
 *   README.md               copy of tools/sap-adt-mcp-launcher/README.md
 *   VERSION                 "<version>" (one line, trailing newline)
 *
 * Default <out> = packaging/dist/openadt-mcp-<version>-<platform>
 */
import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

type BuildTarget = {
  platform: string
  bunTarget: string
}

/** Mapping of openadt release platform ids to Bun compile --target values. */
export const PLATFORM_BUILD_TARGETS: Record<string, BuildTarget> = {
  'win-x64': { platform: 'win-x64', bunTarget: 'bun-windows-x64' },
  'linux-x64': { platform: 'linux-x64', bunTarget: 'bun-linux-x64' },
  'darwin-arm64': { platform: 'darwin-arm64', bunTarget: 'bun-darwin-arm64' },
  'darwin-x64': { platform: 'darwin-x64', bunTarget: 'bun-darwin-x64' },
}

const PLATFORMS = new Set(Object.keys(PLATFORM_BUILD_TARGETS))

export function parsePlatform(value: string | undefined): BuildTarget {
  if (!value || !PLATFORMS.has(value)) {
    throw new Error(
      `Unknown --platform=${value ?? ''}; expected one of: ${[...PLATFORMS].join(', ')}`
    )
  }
  return PLATFORM_BUILD_TARGETS[value]!
}

function readVersion(root: string): string {
  const pom = readFileSync(join(root, 'pom.xml'), 'utf8')
  const match = /<artifactId>openadt-parent<\/artifactId>\s+<version>([^<]+)<\/version>/.exec(pom)
  if (!match) {
    throw new Error('Could not read version from pom.xml')
  }
  return match[1].trim().replace(/-SNAPSHOT$/, '')
}

function spawnOrThrow(cmd: string, args: string[]): void {
  const r = spawnSync(cmd, args, { stdio: 'inherit' })
  if (r.error) {
    throw new Error(`Failed to spawn ${cmd}: ${r.error.message}`)
  }
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} exited with status ${r.status ?? 'unknown'}`)
  }
}

export function readArg(name: '--platform' | '--out'): string | undefined {
  const prefix = `${name}=`
  const found = process.argv.find((a) => a.startsWith(prefix))
  return found?.slice(prefix.length)
}

function main(): void {
  const root = resolve(import.meta.dir, '..')
  const platformArg = readArg('--platform')
  const outArg = readArg('--out')
  const target = parsePlatform(platformArg)
  const platform = target.platform
  const version = readVersion(root)
  const outDir = outArg ?? join(root, 'packaging/dist', `openadt-mcp-${version}-${platform}`)

  mkdirSync(outDir, { recursive: true })
  const ext = platform.startsWith('win-') ? '.exe' : ''
  const entry = join(root, 'tools/sap-adt-mcp-launcher/src/openadt-mcp-bin.ts')
  const outfile = join(outDir, `openadt-mcp${ext}`)

  spawnOrThrow('bun', [
    'build',
    '--compile',
    '--minify',
    `--target=${target.bunTarget}`,
    entry,
    '--outfile',
    outfile,
  ])

  cpSync(join(root, 'LICENSE'), join(outDir, 'LICENSE'))
  cpSync(join(root, 'tools/sap-adt-mcp-launcher/README.md'), join(outDir, 'README.md'))
  const postInstallSrc = join(root, 'packaging/scoop/openadt-mcp-post-install.ps1')
  if (existsSync(postInstallSrc)) {
    mkdirSync(join(outDir, 'bin'), { recursive: true })
    cpSync(postInstallSrc, join(outDir, 'bin', 'openadt-mcp-post-install.ps1'))
  }
  writeFileSync(join(outDir, 'VERSION'), `${version}\n`)

  const size = statSync(outfile).size
  console.log(`Built ${outfile} (${size} bytes) for ${platform}`)
}

if (import.meta.main) {
  try {
    main()
  } catch (err) {
    console.error((err as Error).message)
    process.exit(1)
  }
}
