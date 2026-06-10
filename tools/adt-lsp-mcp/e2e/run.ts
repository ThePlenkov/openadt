#!/usr/bin/env bun
/**
 * ADT LSP MCP e2e scenario runner — tests adt_* tools via MCP stdio.
 * Spec: specs/mcp-ai-testing.md
 */
import { parseCli } from '../../sap-adt-mcp-launcher/e2e/framework/context'
import { runAdtLspE2e } from './runner'

const { exitCode, evidencePath } = await runAdtLspE2e(parseCli(process.argv.slice(2)))
if (evidencePath) {
  console.log(`E2E_EVIDENCE_FILE=${evidencePath}`)
}
process.exit(exitCode)
