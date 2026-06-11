import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { resolveE2eAgent, resolveE2eExecution, resolveE2eModel, type CliOptions } from './context'
import { substituteValue } from './template'
import type { AssertCheck, RunContext, Scenario, ScenarioResult } from './types'

function isOpenadtRepoRoot(dir: string): boolean {
  return (
    existsSync(join(dir, 'mvnw')) ||
    existsSync(join(dir, 'DESIGN.md')) ||
    existsSync(join(dir, 'AGENTS.md'))
  )
}

export function resolveRepoRoot(start: string): string {
  if (process.env.OPENADT_REPO?.trim()) {
    return process.env.OPENADT_REPO.trim()
  }
  let dir = start
  for (let i = 0; i < 12; i++) {
    if (isOpenadtRepoRoot(dir)) return dir
    const parent = join(dir, '..')
    if (parent === dir) break
    dir = parent
  }
  return start
}

export function defaultEvidenceRoot(repoRoot: string): string {
  return join(repoRoot, '.e2e', 'results')
}

/** Single-codepoint verdict markers — safe on Windows 10+, macOS, Linux (no ZWJ). */
export const EVIDENCE_PASS_MARK = '✅'
export const EVIDENCE_FAIL_MARK = '❌'

function evidenceTimestamp(at: Date | string): string {
  const date = typeof at === 'string' ? new Date(at) : at
  return date
    .toISOString()
    .replace(/\.\d{3}Z$/, 'Z')
    .replace(/:/g, '-')
}

function verdictMark(passed: boolean): string {
  return passed ? EVIDENCE_PASS_MARK : EVIDENCE_FAIL_MARK
}

/** `<iso-datetime>-<✅|❌>-<test_id>-<8hex>` */
export function evidenceFileBase(
  testId: string,
  passed: boolean,
  at: Date | string = new Date()
): string {
  const ts = evidenceTimestamp(at)
  const suffix = randomBytes(4).toString('hex')
  const safeId = testId.replace(/[^\w.-]+/g, '-')
  return `${ts}-${verdictMark(passed)}-${safeId}-${suffix}`
}

export function createEvidencePath(
  root: string,
  testId: string,
  passed: boolean,
  at: Date | string = new Date()
): { runId: string; path: string } {
  const runId = evidenceFileBase(testId, passed, at)
  mkdirSync(root, { recursive: true })
  return { runId, path: join(root, `${runId}.md`) }
}

export type E2eSuiteMeta = {
  scenarioFilePrefix: string
  formatCommand: (scenarios: Scenario[], ctx: RunContext) => string
}

type EvidenceReportInput = {
  path: string
  runId: string
  startedAt: string
  finishedAt: string
  exitCode: number
  opts: CliOptions
  ctx: RunContext
  scenarios: Scenario[]
  results: ScenarioResult[]
  mcpMode: string
  suite?: E2eSuiteMeta
}

function gwtText(raw: string, ctx: RunContext): string {
  return substituteValue(raw, ctx) as string
}

function verdictLabel(passed: boolean): string {
  return passed ? '✅ PASS' : '❌ FAIL'
}

function formatIsError(isError: boolean | undefined): string {
  if (isError === undefined) return '❓ unknown'
  return isError ? '❌ true' : '✅ false'
}

function formatChecksTable(checks: AssertCheck[]): string[] {
  return [
    '| Check | Expected | Actual | Result |',
    '| ----- | -------- | ------ | ------ |',
    ...checks.map((c) => `| ${c.name} | ${c.expected} | ${c.actual} | ${verdictLabel(c.passed)} |`),
  ]
}

function formatScenarioBlock(
  scenario: Scenario,
  result: ScenarioResult | undefined,
  ctx: RunContext
): string[] {
  const passed = result?.passed ?? false
  const lines = [
    `## 🧪 ${scenario.code} — ${scenario.title}`,
    '',
    `**Scenario verdict:** ${verdictLabel(passed)}`,
    '',
    '### 🟢 Given',
    '',
    gwtText(scenario.given, ctx),
    '',
    '### ⚡ When',
    '',
    gwtText(scenario.when, ctx),
    '',
    '### 🎯 Then (expected)',
    '',
    gwtText(scenario.then, ctx),
    '',
  ]

  for (const [i, step] of (result?.steps ?? []).entries()) {
    lines.push(`### 🔧 Step ${i + 1}: \`${step.tool}\``, '')
    lines.push(
      `- **MCP replied:** ${step.mcpReplied ? '✅ yes' : '❌ no'}`,
      `- **Duration:** ⏱️ ${step.durationMs ?? '?'}ms`,
      `- **isError:** ${formatIsError(step.isError)}`,
      `- **Args:** \`${JSON.stringify(step.args ?? {})}\``,
      ''
    )
    if (step.checks?.length) {
      lines.push('#### ✅ Assertion checks', '', ...formatChecksTable(step.checks), '')
    }
    if (step.responseBody) {
      lines.push('#### 📦 Response payload', '', '```text', step.responseBody, '```', '')
    }
    lines.push(`**Step verdict:** ${verdictLabel(step.ok)} — ${step.detail}`, '')
  }

  return lines
}

function buildEvidenceMarkdown(input: EvidenceReportInput): string {
  const { scenarios, results, ctx, runId, exitCode } = input
  const suite = input.suite ?? LAUNCHER_E2E_SUITE
  const passed = results.filter((r) => r.passed).length
  const durationMs = new Date(input.finishedAt).getTime() - new Date(input.startedAt).getTime()

  const allPassed = exitCode === 0
  const agent = resolveE2eAgent(input.opts)
  const model = resolveE2eModel(input.opts)
  const lines = [
    `# 📋 E2E evidence — ${scenarios.map((s) => `${s.code}: ${s.title}`).join(', ')}`,
    '',
    `**Verdict:** ${verdictLabel(allPassed)}`,
    `**Run id:** 🆔 ${runId}`,
    `**Started:** 🕐 ${input.startedAt}`,
    `**Finished:** 🕑 ${input.finishedAt}`,
    `**Duration:** ⏱️ ${durationMs}ms`,
    `**Scenarios:** ${allPassed ? '✅' : '⚠️'} ${passed}/${results.length} passed`,
    '',
    '## 🚀 How this run was executed',
    '',
    `- **Command:** \`${suite.formatCommand(scenarios, ctx)}\``,
    `- **Agent:** ${agent}`,
    `- **Model / LLM:** ${model}`,
    `- **Execution:** ${resolveE2eExecution(agent)}`,
    `- **Destination:** ${formatDestination(ctx.destination)}`,
    `- **MCP mode:** ${input.mcpMode}`,
    `- **import-from:** ${ctx.importFrom}`,
    `- **Scenario files:** ${scenarios.map((s) => `${suite.scenarioFilePrefix}${s.file}`).join(', ')}`,
    '',
    '---',
    '',
  ]

  for (const scenario of scenarios) {
    const result = results.find((r) => r.code === scenario.code)
    lines.push(...formatScenarioBlock(scenario, result, ctx), '---', '')
  }

  lines.push(
    '## 🏁 Overall verdict',
    '',
    allPassed
      ? `✅ PASS — all Then criteria met (${passed}/${results.length} scenarios).`
      : `❌ FAIL — ${results.length - passed} scenario(s) did not meet Then criteria.`,
    ''
  )

  return lines.join('\n')
}

export function writeEvidenceReport(input: EvidenceReportInput): void {
  writeFileSync(input.path, buildEvidenceMarkdown(input))
}

function shouldRedactDestination(): boolean {
  return process.env.OPENADT_MCP_REDACT === '1'
}

export function formatDestination(destination: string): string {
  if (shouldRedactDestination()) return '<destination>'
  return destination
}

export function formatE2eCommand(scenarios: Scenario[], ctx: RunContext): string {
  const codes = scenarios.map((s) => s.code).join(' ')
  const dest = ctx.destination?.trim()
  if (!dest) return `bun run e2e -- ${codes}`
  const destArg = shouldRedactDestination() ? '<destination>' : dest
  return `bun run e2e -- ${codes} --destination ${destArg}`
}

export function formatAdtE2eCommand(scenarios: Scenario[], ctx: RunContext): string {
  const codes = scenarios.map((s) => s.code).join(' ')
  const dest = ctx.destination?.trim()
  if (!dest) return `bun run adt:e2e -- ${codes}`
  const destArg = shouldRedactDestination() ? '<destination>' : dest
  return `bun run adt:e2e -- ${codes} --destination ${destArg}`
}

export const LAUNCHER_E2E_SUITE: E2eSuiteMeta = {
  scenarioFilePrefix: 'tools/sap-adt-mcp-launcher/e2e/scenarios/',
  formatCommand: formatE2eCommand,
}

export const ADT_LSP_E2E_SUITE: E2eSuiteMeta = {
  scenarioFilePrefix: 'tools/adt-lsp-mcp/e2e/scenarios/',
  formatCommand: formatAdtE2eCommand,
}
