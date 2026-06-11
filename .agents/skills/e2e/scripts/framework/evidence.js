import { randomBytes } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  unlinkSync,
  readFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { resolveE2eAgent, resolveE2eExecution, resolveE2eModel } from './context'
import { substituteValue } from './template'
import { load as yamlLoad } from 'js-yaml'
export function resolveRepoRoot(start) {
  if (process.env.E2E_REPO?.trim()) {
    return process.env.E2E_REPO.trim()
  }
  let dir = start
  for (let i = 0; i < 12; i++) {
    if (existsSync(join(dir, 'package.json')) || existsSync(join(dir, 'pom.xml'))) {
      return dir
    }
    const parent = join(dir, '..')
    if (parent === dir) break
    dir = parent
  }
  return start
}
export function defaultEvidenceRoot(repoRoot) {
  return join(repoRoot, '.e2e', 'results')
}
/** Single-codepoint verdict markers — safe on Windows 10+, macOS, Linux (no ZWJ). */
export const EVIDENCE_PASS_MARK = '✅'
export const EVIDENCE_FAIL_MARK = '❌'
function evidenceTimestamp(at) {
  const date = typeof at === 'string' ? new Date(at) : at
  return date
    .toISOString()
    .replace(/\.\d{3}Z$/, 'Z')
    .replace(/:/g, '-')
}
function verdictMark(passed) {
  return passed ? EVIDENCE_PASS_MARK : EVIDENCE_FAIL_MARK
}
/** `<iso-datetime>-<✅|❌>-<test_id>-<8hex>` */
export function evidenceFileBase(testId, passed, at = new Date()) {
  const ts = evidenceTimestamp(at)
  const suffix = randomBytes(4).toString('hex')
  const safeId = testId.replace(/[^\w.-]+/g, '-')
  return `${ts}-${verdictMark(passed)}-${safeId}-${suffix}`
}
export function createEvidencePath(root, testId, passed, at = new Date()) {
  const runId = evidenceFileBase(testId, passed, at)
  mkdirSync(root, { recursive: true })
  return { runId, path: join(root, `${runId}.md`) }
}
function gwtText(raw, ctx) {
  return substituteValue(raw, ctx)
}
function verdictLabel(passed) {
  return passed ? '✅ PASS' : '❌ FAIL'
}
function formatIsError(isError) {
  if (isError === undefined) return '❓ unknown'
  return isError ? '❌ true' : '✅ false'
}
function formatChecksTable(checks) {
  return [
    '| Check | Expected | Actual | Result |',
    '| ----- | -------- | ------ | ------ |',
    ...checks.map((c) => `| ${c.name} | ${c.expected} | ${c.actual} | ${verdictLabel(c.passed)} |`),
  ]
}
function formatScenarioBlock(scenario, result, ctx) {
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
function buildEvidenceMarkdown(input) {
  const { scenarios, results, ctx, runId, exitCode } = input
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
    `- **Agent:** ${agent}`,
    `- **Model / LLM:** ${model}`,
    `- **Execution:** ${resolveE2eExecution(agent)}`,
    ...(ctx.destination ? [`- **Destination:** ${formatDestination(ctx.destination)}`] : []),
    `- **Scenario files:** ${scenarios.map((s) => s.file).join(', ')}`,
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
export function writeEvidenceReport(input) {
  writeFileSync(input.path, buildEvidenceMarkdown(input))
}
/** Delete ALL old evidence files for a given scenario code before writing new evidence. */
export function autocleanOldEvidence(root, scenarioCode) {
  if (!existsSync(root)) return
  const files = readdirSync(root).filter(
    (f) => f.endsWith('.md') && f.includes(`-${scenarioCode}-`)
  )
  // Delete all matching files (we're about to write a new one)
  for (const file of files) {
    try {
      unlinkSync(join(root, file))
    } catch (err) {
      // Ignore deletion errors (file might be locked by another process)
    }
  }
}
export function shouldRedactDestination() {
  return process.env.E2E_REDACT === '1'
}
export function formatDestination(destination) {
  if (shouldRedactDestination()) return '<destination>'
  return destination
}
/** Read e2e-agent configuration from TESTING.md frontmatter or .e2e-agent.yaml */
export function readE2eAgentConfig(repoRoot) {
  const config = {}
  // Try .e2e-agent.yaml first
  const yamlConfigPath = join(repoRoot, '.e2e-agent.yaml')
  if (existsSync(yamlConfigPath)) {
    try {
      const yamlContent = readFileSync(yamlConfigPath, 'utf-8')
      const parsed = yamlLoad(yamlContent)
      Object.assign(config, parsed)
    } catch (err) {
      // Ignore YAML parse errors
    }
  }
  // Try TESTING.md frontmatter
  const testingMdPath = join(repoRoot, 'TESTING.md')
  if (existsSync(testingMdPath)) {
    try {
      const content = readFileSync(testingMdPath, 'utf-8')
      const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/)
      if (frontmatterMatch) {
        const frontmatter = yamlLoad(frontmatterMatch[1])
        if (frontmatter['e2e-agent']) {
          Object.assign(config, frontmatter['e2e-agent'])
        }
      }
    } catch (err) {
      // Ignore frontmatter parse errors
    }
  }
  return config
}
/** Default suite meta - implementations should provide their own */
export const DEFAULT_E2E_SUITE = {
  scenarioFilePrefix: 'e2e/scenarios/',
  formatCommand: (scenarios, ctx) => {
    const codes = scenarios.map((s) => s.code).join(' ')
    const args = Object.entries(ctx)
      .filter(([k]) => k !== 'prompt')
      .map(([k, v]) => `--${k} ${v}`)
      .join(' ')
    return args ? `<runner> -- ${codes} ${args}` : `<runner> -- ${codes}`
  },
}
//# sourceMappingURL=evidence.js.map
