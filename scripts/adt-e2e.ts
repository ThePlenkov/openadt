#!/usr/bin/env bun
/**
 * /e2e entry for adt-* scenarios on @openadt/adt-lsp-mcp.
 * Usage: bun run adt:e2e -- adt-1 --destination ABC_200_USER_EN
 */
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCli } from '../tools/sap-adt-mcp-launcher/e2e/framework/context'
import {
  defaultEvidenceRoot,
  resolveRepoRoot,
} from '../tools/sap-adt-mcp-launcher/e2e/framework/evidence'
import { runAdtLspE2eDispatch } from '../tools/sap-adt-mcp-launcher/e2e/framework/dispatch'
import { runAdtLspE2e } from '../tools/adt-lsp-mcp/e2e/runner'

process.env.OPENADT_E2E_EVIDENCE = '1'
const repoRoot = resolveRepoRoot(dirname(fileURLToPath(import.meta.url)))
const argv = process.argv.slice(2)
const cli = parseCli(argv)

if (cli.executor === 'acp') {
  const { exitCode } = runAdtLspE2eDispatch(cli, repoRoot)
  process.exit(exitCode)
}
if (!argv.includes('--evidence')) {
  argv.push('--evidence')
}
if (!argv.includes('--evidence-dir')) {
  argv.push('--evidence-dir', defaultEvidenceRoot(repoRoot))
}

const { exitCode, evidencePath } = await runAdtLspE2e(parseCli(argv))
if (evidencePath) {
  console.log(`E2E_EVIDENCE_FILE=${evidencePath}`)
}
process.exit(exitCode)
