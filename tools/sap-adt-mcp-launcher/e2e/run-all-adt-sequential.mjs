#!/usr/bin/env bun
/* global Bun */
/**
 * Sequential ADT scenario runner — runs each scenario in fresh context using /e2e skill.
 * Ensures isolated, fair testing with evidence collection for each scenario.
 */
import { parseCli } from './framework/context'
import { loadScenarios } from './framework/scenarios'

const opts = parseCli(process.argv.slice(2))

// Load all scenarios and filter to adt-* only
const root = new URL('.', import.meta.url).pathname
const allScenarios = loadScenarios(root)
const adtScenarios = allScenarios.filter((s) => s.code.startsWith('adt-'))

if (opts.scenario) {
  console.error(
    'Error: run-all-adt-sequential.mjs runs all ADT scenarios. Use run-adt.mjs for single scenario.'
  )
  process.exit(1)
}

const destination = opts.destination || process.env.OPENADT_MCP_DESTINATION
if (!destination) {
  console.error(
    'Error: Missing destination. Pass --destination ABC_200_USER_EN or set OPENADT_MCP_DESTINATION.'
  )
  process.exit(1)
}

console.log(`=== Sequential ADT Scenario Runner ===`)
console.log(`destination: ${destination}`)
console.log(`scenarios: ${adtScenarios.length} ADT scenarios\n`)

// Run each scenario sequentially
const results = []
for (const scenario of adtScenarios) {
  console.log(`\n--- Running ${scenario.code} ${scenario.id} ---`)

  const scenarioArgs = [
    'tools/sap-adt-mcp-launcher/ai-tests/run-adt.mjs',
    '--destination',
    destination,
    '--scenario',
    scenario.code,
    ...(opts.importFrom !== 'adtls' ? ['--import-from', opts.importFrom] : []),
    ...(opts.port !== 2239 ? ['--port', String(opts.port)] : []),
    ...(opts.timeoutMs !== 300000 ? ['--timeout-ms', String(opts.timeoutMs)] : []),
    ...(opts.evidence ? ['--evidence'] : []),
  ]

  const proc = Bun.spawn(['bun', ...scenarioArgs], {
    stdout: 'pipe',
    stderr: 'inherit',
  })

  const textDecoder = new TextDecoder()
  let output = ''
  for await (const chunk of proc.stdout) {
    output += textDecoder.decode(chunk)
    process.stdout.write(chunk)
  }

  const exitCode = await proc.exited
  const passed = exitCode === 0

  results.push({
    code: scenario.code,
    id: scenario.id,
    passed,
    exitCode,
  })

  console.log(`--- ${scenario.code} ${scenario.id}: ${passed ? 'PASS' : 'FAIL'} (${exitCode}) ---`)
}

// Print summary
console.log(`\n=== Summary ===`)
const passed = results.filter((r) => r.passed).length
console.log(`${passed}/${results.length} scenarios passed`)

for (const r of results) {
  console.log(`${r.passed ? '✓' : '✗'} ${r.code} ${r.id}`)
}

process.exit(passed === results.length ? 0 : 1)
