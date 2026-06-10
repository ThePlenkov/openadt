#!/usr/bin/env bun
/**
 * External ADT LSP E2E dispatch — write .e2e/dispatch/<run-id>.json and print ACP handoff.
 * Usage: bun run adt:e2e:dispatch -- adt-1 --destination ABC_200_USER_EN --acp --agent devin
 */
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCli } from '../tools/sap-adt-mcp-launcher/e2e/framework/context'
import { runAdtLspE2eDispatch } from '../tools/sap-adt-mcp-launcher/e2e/framework/dispatch'
import { resolveRepoRoot } from '../tools/sap-adt-mcp-launcher/e2e/framework/evidence'

const repoRoot = resolveRepoRoot(dirname(fileURLToPath(import.meta.url)))
const { exitCode } = runAdtLspE2eDispatch(parseCli(process.argv.slice(2)), repoRoot)
process.exit(exitCode)
