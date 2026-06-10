#!/usr/bin/env bun
/**
 * ADT LSP MCP e2e scenario runner — tests adt_* tools via MCP stdio.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import { AdtLspMcpClient } from './mcp-client'

const e2eRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const launcher = join(e2eRoot, 'dist', 'main.mjs')
const scenariosDir = join(e2eRoot, 'e2e', 'scenarios')

type ScenarioStep = {
  tool: string
  args: Record<string, unknown>
  assert?: {
    contentContains?: string | string[]
    notError?: boolean
  }
}

type Scenario = {
  code: string
  id: string
  title: string
  steps: ScenarioStep[]
}

function getFlag(argv: string[], flag: string): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!
    if (arg === flag) {
      const next = argv[i + 1]
      return next && !next.startsWith('-') ? next : undefined
    }
    if (arg.startsWith(`${flag}=`)) {
      return arg.slice(flag.length + 1) || undefined
    }
  }
  return undefined
}

function substitute(value: unknown, destination: string): unknown {
  if (typeof value === 'string') {
    return value.replaceAll('{{destination}}', destination)
  }
  if (Array.isArray(value)) {
    return value.map((v) => substitute(v, destination))
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = substitute(v, destination)
    }
    return out
  }
  return value
}

function scenarioFileMatches(file: string, selector: string): boolean {
  const key = selector.trim().toLowerCase()
  if (file.toLowerCase().startsWith(`${key}-`)) return true
  return file.toLowerCase().includes(`-${key}-`) || file.toLowerCase().includes(`-${key}.`)
}

function loadScenarios(selector?: string): Scenario[] {
  if (!existsSync(scenariosDir)) {
    throw new Error(`Scenarios directory not found: ${scenariosDir}`)
  }
  const allFiles = readdirSync(scenariosDir)
    .filter((f) => f.endsWith('.md'))
    .sort()
  const files = selector ? allFiles.filter((f) => scenarioFileMatches(f, selector)) : allFiles
  if (selector && files.length === 0) {
    throw new Error(`Unknown scenario: ${selector}`)
  }
  const out: Scenario[] = []
  for (const file of files) {
    const raw = readFileSync(join(scenariosDir, file), 'utf8')
    const trimmed = raw.replace(/^\uFEFF/, '').trimStart()
    const end = trimmed.indexOf('\n---', 3)
    if (end < 0) continue
    const meta = yaml.load(trimmed.slice(3, end).trim()) as {
      code?: string
      id?: string
      title?: string
      steps?: ScenarioStep[]
    }
    if (!meta.code || !meta.id || !meta.steps?.length) continue
    out.push({
      code: meta.code,
      id: meta.id,
      title: meta.title ?? meta.id,
      steps: meta.steps,
    })
  }
  return out
}

function filterScenarios(all: Scenario[], selector: string | undefined): Scenario[] {
  if (!selector) return all
  const key = selector.trim().toLowerCase()
  const hit = all.filter((s) => s.code === key || s.id.toLowerCase() === key)
  if (hit.length === 0) {
    throw new Error(`Unknown scenario: ${selector}`)
  }
  return hit
}

function extractPayload(result: unknown): { contentText: string; isError: boolean } {
  const r = result as {
    isError?: boolean
    content?: Array<{ type?: string; text?: string }>
  }
  const parts = (r.content ?? []).filter((c) => c.type === 'text' && c.text).map((c) => c.text!)
  return { contentText: parts.join('\n'), isError: r.isError === true }
}

function evaluateStep(
  assert: ScenarioStep['assert'],
  payload: { contentText: string; isError: boolean }
): { ok: boolean; detail: string } {
  if (assert?.notError && payload.isError) {
    return { ok: false, detail: 'tool returned isError=true' }
  }
  const needles = assert?.contentContains
    ? Array.isArray(assert.contentContains)
      ? assert.contentContains
      : [assert.contentContains]
    : []
  for (const needle of needles) {
    if (!payload.contentText.includes(needle)) {
      return { ok: false, detail: `missing "${needle}" in response` }
    }
  }
  if (payload.contentText.trim().length === 0) {
    return { ok: false, detail: 'empty response body' }
  }
  return { ok: true, detail: `${payload.contentText.length} chars` }
}

async function runScenario(scenario: Scenario, destination: string): Promise<boolean> {
  console.log(`--- ${scenario.code} ${scenario.id}: ${scenario.title} ---`)
  const client = new AdtLspMcpClient(launcher, destination)
  let passed = true

  try {
    await client.start()
    for (const step of scenario.steps) {
      const args = substitute(step.args, destination) as Record<string, unknown>
      const t0 = Date.now()
      let result: unknown
      try {
        result = await client.callTool(step.tool, args)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.log(`✗ ${step.tool}: ${msg}`)
        passed = false
        continue
      }
      const payload = extractPayload(result)
      const verdict = evaluateStep(step.assert, payload)
      console.log(
        `${verdict.ok ? '✓' : '✗'} ${step.tool}: ${verdict.detail} (${Date.now() - t0}ms)`
      )
      if (!verdict.ok) passed = false
    }
  } finally {
    client.close()
  }

  console.log(`${passed ? '✓' : '✗'} ${scenario.code}: ${passed ? 'PASSED' : 'FAILED'}`)
  return passed
}

async function main(): Promise<void> {
  if (!existsSync(launcher)) {
    console.error(`Build required: bun run build (missing ${launcher})`)
    process.exit(1)
  }

  const argv = process.argv.slice(2)
  const destination =
    getFlag(argv, '--destination') ??
    argv.find((a) => !a.startsWith('-')) ??
    process.env.OPENADT_MCP_DESTINATION

  if (!destination) {
    console.error('Usage: bun e2e/run.ts --destination <SID_CLIENT_USER_LANG> [--scenario adt-1]')
    process.exit(1)
  }

  const scenarioSelector = getFlag(argv, '--scenario')
  const scenarios = filterScenarios(loadScenarios(scenarioSelector), scenarioSelector)
  console.log(`Running ${scenarios.length} scenario(s) with destination: ${destination}\n`)

  const results: boolean[] = []
  for (const scenario of scenarios) {
    results.push(await runScenario(scenario, destination))
  }

  const passed = results.filter(Boolean).length
  console.log(`\n=== Summary: ${passed}/${results.length} scenarios passed ===`)
  process.exit(passed === results.length ? 0 : 1)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
