import { randomBytes } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CliOptions } from './context'
import {
  ACP_AGENTS_URL,
  ACP_GET_STARTED_URL,
  buildRunContext,
  resolveAcpAgent,
  resolveE2eModel,
} from './context'
import { defaultEvidenceRoot } from './evidence'
import { filterScenarios, loadScenariosFromRoot } from './scenarios'
import type { E2eSuiteMeta } from './evidence'

export type E2eDispatchPayload = {
  version: 1
  runId: string
  createdAt: string
  executor: 'acp'
  /** ACP registry agent id — from --agent or ACP_AGENT env. */
  acpAgent: string
  dispatchedFrom: string
  repoRoot: string
  scenario: string
  scenarioFile: string
  ctx: Record<string, any>
  command: {
    /** Exact local runner command for the external agent to execute. */
    local: string
  }
  prompt: string
  env: Record<string, string>
  evidenceDir: string
  skillPath: string
  specPath: string
  acpDocs: {
    agents: string
    getStarted: string
  }
  status: 'pending'
}

function dispatchTimestamp(at: Date = new Date()): string {
  return at
    .toISOString()
    .replace(/\.\d{3}Z$/, 'Z')
    .replace(/:/g, '-')
}

/** `<iso-datetime>-dispatch-<test_id>-<8hex>` */
export function dispatchRunId(testId: string, at: Date = new Date()): string {
  const suffix = randomBytes(4).toString('hex')
  const safeId = testId.replace(/[^\w.-]+/g, '-')
  return `${dispatchTimestamp(at)}-dispatch-${safeId}-${suffix}`
}

export function defaultDispatchRoot(repoRoot: string): string {
  return join(repoRoot, '.e2e', 'dispatch')
}

function shellQuote(value: string): string {
  if (/^[\w@./:-]+$/.test(value)) return value
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function buildLocalRunCommand(
  runnerScript: string,
  scenario: string,
  ctx: Record<string, any>,
  agent: string,
  model: string
): string {
  const parts = [
    'bun',
    'run',
    runnerScript,
    '--',
    scenario,
    ...Object.entries(ctx)
      .filter(([k]) => k !== 'prompt')
      .flatMap(([k, v]) => [`--${k}`, shellQuote(String(v))]),
    '--agent',
    agent,
  ]
  if (model && !model.startsWith('(none')) {
    parts.push('--model', shellQuote(model))
  }
  return parts.join(' ')
}

function buildAcpPrompt(input: {
  scenario: string
  scenarioFilePath: string
  ctx: Record<string, any>
  localCommand: string
  acpAgent: string
  specPath?: string
}): string {
  const ctxSummary = Object.entries(input.ctx)
    .filter(([k]) => k !== 'prompt')
    .map(([k, v]) => `${k}=${v}`)
    .join(', ')
  const lines = [
    `Run E2E scenario ${input.scenario}${ctxSummary ? ` with context: ${ctxSummary}` : ''}.`,
    '',
    'Follow the e2e skill contract:',
    `1. Read scenario: ${input.scenarioFilePath}`,
    `2. Execute: ${input.localCommand}`,
    '3. Report PASS/FAIL, exit code, and E2E_EVIDENCE_FILE path.',
    '4. Summarize Given/When/Then and assertion table highlights (no secrets).',
    '',
    'Evidence lands under .e2e/results/',
    '',
    `ACP agent: ${input.acpAgent} (${ACP_AGENTS_URL})`,
  ]
  if (input.specPath) {
    lines.push('', `Spec: ${input.specPath}`)
  }
  return lines.join('\n')
}

export function buildE2eDispatch(
  opts: CliOptions,
  repoRoot: string,
  config: {
    e2eRoot: string
    runnerScript: string
    suite?: E2eSuiteMeta
    usageExample: string
    specPath?: string
  }
): E2eDispatchPayload {
  if (opts.list) {
    throw new Error('Dispatch does not support --list; run without --acp.')
  }
  const scenarioKey = opts.scenario?.trim()
  if (!scenarioKey) {
    throw new Error(`Dispatch requires a scenario code. Usage: ${config.usageExample}`)
  }
  const acpAgent = resolveAcpAgent(opts)
  const scenarios = filterScenarios(loadScenariosFromRoot(config.e2eRoot, scenarioKey), scenarioKey)
  const testId = scenarios.map((s) => s.code).join('_')
  const scenario = scenarios[0]!
  const model = resolveE2eModel(opts)
  const evidenceDir = opts.evidenceRoot ?? defaultEvidenceRoot(repoRoot)
  const ctx = buildRunContext(opts)
  const localCommand = buildLocalRunCommand(
    config.runnerScript,
    scenario.code,
    ctx,
    acpAgent,
    model
  )
  const scenarioFilePath = config.suite
    ? `${config.suite.scenarioFilePrefix}${scenario.file}`
    : `${config.e2eRoot}/${scenario.file}`
  const prompt = buildAcpPrompt({
    scenario: scenario.code,
    scenarioFilePath,
    ctx,
    localCommand,
    acpAgent,
    specPath: config.specPath,
  })
  const env = buildDispatchEnv({ acpAgent, ctx, model: opts.model })
  const runId = dispatchRunId(testId)
  const dispatchedFrom = process.env.E2E_DISPATCHED_FROM?.trim() || 'cursor'

  return {
    version: 1,
    runId,
    createdAt: new Date().toISOString(),
    executor: 'acp',
    acpAgent,
    dispatchedFrom,
    repoRoot,
    scenario: scenario.code,
    scenarioFile: scenario.file,
    ctx,
    command: { local: localCommand },
    env,
    prompt,
    evidenceDir,
    skillPath: '.agents/skills/e2e/SKILL.md',
    specPath: config.specPath || '',
    acpDocs: {
      agents: ACP_AGENTS_URL,
      getStarted: ACP_GET_STARTED_URL,
    },
    status: 'pending',
  }
}

function buildDispatchEnv(args: {
  acpAgent: string
  ctx: Record<string, any>
  model: string | undefined
}): Record<string, string> {
  const env: Record<string, string> = {
    E2E_AGENT: args.acpAgent,
    E2E_EVIDENCE: '1',
    ACP_AGENT: args.acpAgent,
  }
  // Add dynamic context as env vars
  Object.entries(args.ctx)
    .filter(([k]) => k !== 'prompt')
    .forEach(([k, v]) => {
      env[`E2E_${k.toUpperCase()}`] = String(v)
    })
  const model = args.model?.trim()
  if (model) env.E2E_MODEL = model
  return env
}

export function writeDispatchFile(root: string, payload: E2eDispatchPayload): string {
  mkdirSync(root, { recursive: true })
  const path = join(root, `${payload.runId}.json`)
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  return path
}

export function formatDispatchInstructions(payload: E2eDispatchPayload): string {
  const dispatchPath = join(payload.repoRoot, '.e2e', 'dispatch', `${payload.runId}.json`)
  const ctxSummary = Object.entries(payload.ctx)
    .filter(([k]) => k !== 'prompt')
    .map(([k, v]) => `${k}=${v}`)
    .join(', ')
  const lines = [
    'E2E dispatch — ACP external executor',
    '',
    `Run id:      ${payload.runId}`,
    `Scenario:    ${payload.scenario} (${payload.scenarioFile})`,
    ...(ctxSummary ? [`Context:     ${ctxSummary}`] : []),
    `ACP agent:   ${payload.acpAgent}`,
    `Dispatch:    ${dispatchPath}`,
    '',
    'Do not run locally — hand off via Agent Client Protocol (ACP).',
    '',
    '1. Agent list: ' + payload.acpDocs.agents,
    '2. Protocol:   ' + payload.acpDocs.getStarted,
    `3. Target agent id: ${payload.acpAgent} (from --agent or env ACP_AGENT)`,
    '',
    'Submit the prompt below through your ACP client (session/prompt).',
    'The external agent runs this command in the repo checkout:',
    '',
    payload.command.local,
    '',
    '--- prompt ---',
    payload.prompt,
    '---',
    '',
    'When the ACP agent completes, read E2E_EVIDENCE_FILE from its output under .e2e/results/.',
    'No ACP CLI is wired in this repo; the JSON dispatch file is the handoff contract.',
  ]
  return lines.join('\n')
}

export type RunE2eDispatchOutcome = {
  exitCode: number
  dispatchPath?: string
}

export function runE2eDispatch(
  build: (opts: CliOptions, repoRoot: string, config: any) => E2eDispatchPayload,
  opts: CliOptions,
  repoRoot: string,
  config: any
): RunE2eDispatchOutcome {
  try {
    const payload = build(opts, repoRoot, config)
    const dispatchRoot = defaultDispatchRoot(repoRoot)
    const dispatchPath = writeDispatchFile(dispatchRoot, payload)
    console.log(formatDispatchInstructions(payload))
    console.log(`\nE2E_DISPATCH_FILE=${dispatchPath}`)
    return { exitCode: 0, dispatchPath }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`E2E dispatch failed: ${message}`)
    return { exitCode: 1 }
  }
}
