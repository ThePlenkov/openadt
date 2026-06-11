import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  evaluateAssert,
  extractToolPayload,
} from '../../sap-adt-mcp-launcher/e2e/framework/assertions'
import type { CliOptions } from '../../sap-adt-mcp-launcher/e2e/framework/context'
import {
  buildRunContext,
  resolveDestinationId,
} from '../../sap-adt-mcp-launcher/e2e/framework/context'
import {
  ADT_LSP_E2E_SUITE,
  createEvidencePath,
  defaultEvidenceRoot,
  resolveRepoRoot,
  writeEvidenceReport,
} from '../../sap-adt-mcp-launcher/e2e/framework/evidence'
import {
  filterScenarios,
  loadScenariosFromRoot,
} from '../../sap-adt-mcp-launcher/e2e/framework/scenarios'
import {
  redact,
  substituteArgs,
  substituteAssert,
} from '../../sap-adt-mcp-launcher/e2e/framework/template'
import type {
  Scenario,
  ScenarioResult,
  StepResult,
} from '../../sap-adt-mcp-launcher/e2e/framework/types'
import { AdtLspMcpClient } from './mcp-client'

const e2eRoot = join(dirname(fileURLToPath(import.meta.url)))
const packageRoot = join(e2eRoot, '..')
const launcher = join(packageRoot, 'dist', 'main.mjs')

export type RunAdtLspE2eOutcome = {
  exitCode: number
  evidencePath?: string
}

export function printCatalog(scenarios: Scenario[]): void {
  console.log('ADT LSP MCP scenarios (pass --destination at run time):\n')
  for (const s of scenarios) {
    console.log(`• ${s.code} — ${s.title}`)
    console.log(`  id: ${s.id}`)
    console.log(`  file: e2e/scenarios/${s.file}`)
    const preview = s.intent.replace(/\s+/g, ' ').slice(0, 100)
    console.log(`  brief: ${preview}…\n`)
  }
}

export type RunAdtLspE2eInput = {
  opts: CliOptions
  scenarios?: Scenario[]
}

function startAdtLspRun(input: RunAdtLspE2eInput | CliOptions): {
  opts: CliOptions
  allScenarios: Scenario[]
  startedAt: string
  testId: string
  ctx: ReturnType<typeof buildRunContext>
  selected: Scenario[]
  evidenceRoot: string
} | null {
  const opts = 'opts' in input ? input.opts : input
  const allScenarios =
    'scenarios' in input && input.scenarios
      ? input.scenarios
      : loadScenariosFromRoot(e2eRoot, opts.scenario).filter((s) => s.code.startsWith('adt-'))

  if (opts.list) {
    printCatalog(loadScenariosFromRoot(e2eRoot, undefined, { skipInvalid: true }))
    return null
  }
  if (!existsSync(launcher)) {
    console.error(`Build required: bun run build (missing ${launcher})`)
    return null
  }
  const startedAt = new Date().toISOString()
  const destination = resolveDestinationId(opts)
  const ctx = buildRunContext(opts, destination)
  const selected = filterScenarios(allScenarios, opts.scenario)
  const evidenceRoot = opts.evidenceRoot ?? defaultEvidenceRoot(resolveRepoRoot(packageRoot))
  const testId = selected.map((s) => s.code).join('_')
  return { opts, allScenarios, startedAt, testId, ctx, selected, evidenceRoot }
}

function maybeWriteAdtLspEvidence(
  run: NonNullable<ReturnType<typeof startAdtLspRun>>,
  results: ScenarioResult[],
  exitCode: number
): string | undefined {
  if (!run.opts.evidence) return undefined
  const passed = exitCode === 0
  const { runId, path } = createEvidencePath(run.evidenceRoot, run.testId, passed, run.startedAt)
  writeEvidenceReport({
    path,
    runId,
    startedAt: run.startedAt,
    finishedAt: new Date().toISOString(),
    exitCode,
    opts: run.opts,
    ctx: run.ctx,
    scenarios: run.selected,
    results,
    mcpMode: 'adt-lsp-mcp (direct LSP stdio)',
    suite: ADT_LSP_E2E_SUITE,
  })
  console.log(`\nEvidence written: ${path}`)
  return path
}

function printAdtLspHeader(run: NonNullable<ReturnType<typeof startAdtLspRun>>): void {
  console.log(`=== ADT LSP MCP e2e ===`)
  console.log(`destination: ${redact(run.ctx.destination, run.ctx)}`)
  console.log(`scenarios: ${run.selected.map((s) => `${s.code} (${s.id})`).join(', ')}\n`)
  if (run.opts.evidence) {
    console.log(`evidence: ${run.evidenceRoot} (filename gets ✅/❌ on completion)\n`)
  }
}

export async function runAdtLspE2e(
  input: RunAdtLspE2eInput | CliOptions
): Promise<RunAdtLspE2eOutcome> {
  const run = startAdtLspRun(input)
  if (!run) return { exitCode: 0 }
  printAdtLspHeader(run)

  const timeout = setTimeout(() => {
    console.error('Run timeout — SSO/logon may be stuck')
  }, run.ctx.timeoutMs).unref()

  let exitCode = 1
  const results: ScenarioResult[] = []
  try {
    for (const scenario of run.selected) {
      results.push(await runScenario(scenario, run.ctx))
    }
    printSummary(results)
    exitCode = results.every((r) => r.passed) ? 0 : 1
  } finally {
    clearTimeout(timeout)
  }
  const evidencePath = maybeWriteAdtLspEvidence(run, results, exitCode)
  return { exitCode, evidencePath }
}

async function runScenario(
  scenario: Scenario,
  ctx: ReturnType<typeof buildRunContext>
): Promise<ScenarioResult> {
  console.log(`--- ${scenario.code} ${scenario.id}: ${scenario.title} ---`)
  const client = new AdtLspMcpClient(launcher, ctx.destination, ctx.timeoutMs)
  const steps: StepResult[] = []

  try {
    await client.start()
    for (const step of scenario.steps) {
      const args = substituteArgs(step.args, ctx)
      const t0 = Date.now()
      let result: unknown
      try {
        result = await client.callTool(step.tool, args)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.log(`✗ ${step.tool}: ${redact(msg, ctx)}`)
        steps.push({
          tool: step.tool,
          ok: false,
          detail: msg,
          durationMs: Date.now() - t0,
          args,
          mcpReplied: false,
          checks: [
            {
              name: 'mcp_replied',
              expected: 'MCP tool returned a response',
              actual: `transport error: ${msg}`,
              passed: false,
            },
          ],
        })
        continue
      }
      const payload = extractToolPayload(result)
      const verdict = evaluateAssert(substituteAssert(step.assert, ctx), payload)
      const icon = verdict.ok ? '✓' : '✗'
      console.log(`${icon} ${step.tool}: ${redact(verdict.detail, ctx)}`)
      steps.push({
        tool: step.tool,
        ok: verdict.ok,
        detail: verdict.detail,
        durationMs: Date.now() - t0,
        args,
        mcpReplied: true,
        isError: payload.isError,
        checks: verdict.checks,
        responseBody: redact(payload.contentText.slice(0, 4000), ctx),
      })
    }
  } finally {
    client.close()
  }

  const passed = steps.every((s) => s.ok)
  return {
    code: scenario.code,
    id: scenario.id,
    title: scenario.title,
    passed,
    steps,
  }
}

function printSummary(results: ScenarioResult[]): void {
  const passed = results.filter((r) => r.passed).length
  console.log(`\n=== Summary: ${passed}/${results.length} scenarios passed ===`)
  for (const r of results) {
    console.log(`${r.passed ? '✓' : '✗'} ${r.code} ${r.id}`)
  }
}
