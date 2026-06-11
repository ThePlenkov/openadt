#!/usr/bin/env node
/**
 * E2E AI Testing Agent CLI
 *
 * Usage:
 *   npx e2e-agent <command> [options]
 *   bunx e2e-agent <command> [options]
 *
 * Commands:
 *   list <scenarios-dir>           - List all scenarios in a directory
 *   run <scenarios-dir> <code>     - Run a specific scenario
 *   dispatch <config>              - Generate ACP dispatch payload
 *   help                           - Show this help message
 */

import { parseArgs } from 'node:util'
import { loadScenariosFromDir } from './scripts/framework/scenarios.js'
import { parseCli } from './scripts/framework/context.js'
import type { Scenario } from './scripts/framework/types.js'

const commands = {
  list: async (args: string[]) => {
    const [scenariosDir] = args
    if (!scenariosDir) {
      console.error('Error: scenarios-dir is required for list command')
      process.exit(1)
    }
    const scenarios = loadScenariosFromDir(scenariosDir)
    console.log(`Found ${scenarios.length} scenarios:`)
    for (const s of scenarios) {
      console.log(`  ${s.code}: ${s.title} (${s.id})`)
    }
  },

  run: async (args: string[]) => {
    const [scenariosDir, code] = args
    if (!scenariosDir || !code) {
      console.error('Error: scenarios-dir and code are required for run command')
      process.exit(1)
    }
    const scenarios = loadScenariosFromDir(scenariosDir)
    const scenario = scenarios.find((s) => s.code === code)
    if (!scenario) {
      console.error(`Error: Scenario ${code} not found`)
      process.exit(1)
    }
    console.log(`Running scenario: ${scenario.code} - ${scenario.title}`)
    console.log(`Given: ${scenario.given}`)
    console.log(`When:  ${scenario.when}`)
    console.log(`Then:  ${scenario.then}`)
    console.log(`\nSteps: ${scenario.steps.length}`)
  },

  help: async () => {
    console.log(`
E2E AI Testing Agent CLI

Usage:
  npx e2e-agent <command> [options]
  bunx e2e-agent <command> [options]

Commands:
  list <scenarios-dir>           - List all scenarios in a directory
  run <scenarios-dir> <code>     - Run a specific scenario
  dispatch <config>              - Generate ACP dispatch payload
  help                           - Show this help message

Examples:
  npx e2e-agent list ./e2e/scenarios
  npx e2e-agent run ./e2e/scenarios test-1

For AI Agents:
  This CLI provides helper functions to:
  - List available scenarios
  - Run individual scenarios
  - Generate dispatch payloads for ACP execution

  The framework scripts in scripts/framework/ are internal utilities
  that can be imported directly for custom integrations.
`)
  },
}

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      help: {
        type: 'boolean',
        short: 'h',
      },
    },
  })

  const [command, ...commandArgs] = positionals

  if (values.help || !command || command === 'help') {
    await commands.help()
    return
  }

  const handler = commands[command as keyof typeof commands]
  if (!handler) {
    console.error(`Error: Unknown command "${command}"`)
    await commands.help()
    process.exit(1)
  }

  try {
    await handler(commandArgs)
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

main()
