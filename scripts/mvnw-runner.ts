#!/usr/bin/env node
import { spawnSync, type SpawnSyncOptions } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const wrapper = process.platform === 'win32' ? 'mvnw.cmd' : 'mvnw'
const command = join(repoRoot, wrapper)

const options: SpawnSyncOptions = {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
}

const result = spawnSync(command, process.argv.slice(2), options)

process.exit(result.status ?? 1)
