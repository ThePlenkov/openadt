#!/usr/bin/env bun
/**
 * ADT scenario runner — runs only OpenADT tools (adt_*).
 * Uses existing framework but filters to adt-* scenarios.
 * Note: Does not use --no-proxy; relies on scenario filtering only.
 */
import { parseCli } from './framework/context'
import { runAiTests } from './framework/runner'
import { filterScenarios, loadScenarios } from './framework/scenarios'

const opts = parseCli(process.argv.slice(2))

// Load all scenarios and filter to adt-* only
const root = new URL('.', import.meta.url).pathname
const allScenarios = loadScenarios(root)
const adtScenarios = allScenarios.filter((s) => s.code.startsWith('adt-'))

// If a specific scenario is requested, check if it's an adt scenario
if (opts.scenario) {
  const filtered = filterScenarios(allScenarios, opts.scenario)
  if (!filtered[0]?.code.startsWith('adt-')) {
    console.error(
      `Error: Scenario ${opts.scenario} is not an ADT scenario (adt-*). Use mcp:ai-tests for mcp-* scenarios.`
    )
    process.exit(1)
  }
}

// Override scenario list to only ADT scenarios
const { exitCode } = await runAiTests({
  opts,
  scenarios: adtScenarios,
})

process.exit(exitCode)
