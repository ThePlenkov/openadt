#!/usr/bin/env bun
/**
 * /e2e entry — run MCP AI scenario(s) and write evidence to <repo>/.e2e/results/<run>.md
 * Usage: bun run e2e -- mcp-1 [--destination ABC_200_USER_EN]
 */
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCli } from '../tools/sap-adt-mcp-launcher/e2e/framework/context'
import { runE2eDispatch } from '../tools/sap-adt-mcp-launcher/e2e/framework/dispatch'
import {
  defaultEvidenceRoot,
  resolveRepoRoot,
} from '../tools/sap-adt-mcp-launcher/e2e/framework/evidence'
import { runAiTests } from '../tools/sap-adt-mcp-launcher/e2e/framework/runner'

process.env.OPENADT_E2E_EVIDENCE = '1'
const repoRoot = resolveRepoRoot(dirname(fileURLToPath(import.meta.url)))
const argv = process.argv.slice(2)
const cli = parseCli(argv)

if (cli.executor === 'acp') {
  const { exitCode } = runE2eDispatch(cli, repoRoot)
  process.exit(exitCode)
}
if (!argv.includes('--evidence')) {
  argv.push('--evidence')
}
if (!argv.includes('--evidence-dir')) {
  argv.push('--evidence-dir', defaultEvidenceRoot(repoRoot))
}

const { exitCode, evidencePath } = await runAiTests(parseCli(argv))
if (evidencePath) {
  console.log(`E2E_EVIDENCE_FILE=${evidencePath}`)
}
process.exit(exitCode)
