import { randomBytes } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CliOptions } from './context'
import {
  ACP_AGENTS_URL,
  ACP_GET_STARTED_URL,
  resolveAcpAgent,
  resolveDestinationId,
  resolveE2eModel,
} from './context'
import { defaultEvidenceRoot } from './evidence'
import { filterScenarios, loadScenarios } from './scenarios'

const aiTestsRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

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
  destination: string
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
  return `"${value.replace(/"/g, '\\"')}"`
}

function buildLocalRunCommand(
  scenario: string,
  destination: string,
  agent: string,
  model: string
): string {
  const parts = [
    'bun',
    'run',
    'e2e',
    '--',
    scenario,
    '--destination',
    shellQuote(destination),
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
  scenarioFile: string
  destination: string
  localCommand: string
  acpAgent: string
}): string {
  return [
    `Run OpenADT MCP E2E scenario ${input.scenario} on destination ${input.destination}.`,
    '',
    'Follow the /e2e skill contract (specs/mcp-ai-testing.md):',
    `1. Read scenario: tools/sap-adt-mcp-launcher/ai-tests/scenarios/${input.scenarioFile}`,
    `2. Execute: ${input.localCommand}`,
    '3. Report PASS/FAIL, exit code, and E2E_EVIDENCE_FILE path.',
    '4. Summarize Given/When/Then and assertion table highlights (no secrets).',
    '',
    'Evidence lands under .e2e/results/',
    '',
    'Prerequisites: SAP ADT VS Code extension, adt-lsc, ~/.adtls logon, SSO approval (300s timeout).',
    '',
    `ACP agent: ${input.acpAgent} (${ACP_AGENTS_URL})`,
  ].join('\n')
}

export function buildE2eDispatch(opts: CliOptions, repoRoot: string): E2eDispatchPayload {
  if (opts.list) {
    throw new Error('Dispatch does not support --list; run without --acp.')
  }
  const scenarioKey = opts.scenario?.trim()
  if (!scenarioKey) {
    throw new Error(
      'Dispatch requires a scenario code (e.g. mcp-1). ' +
        'Usage: bun run e2e -- mcp-1 --destination <ID> --acp --agent <acp-agent-id>'
    )
  }
  const acpAgent = resolveAcpAgent(opts)
  const destination = resolveDestinationId(opts)
  const scenarios = filterScenarios(loadScenarios(aiTestsRoot), scenarioKey)
  const testId = scenarios.map((s) => s.code).join('_')
  const scenario = scenarios[0]!
  const model = resolveE2eModel(opts)
  const evidenceDir = opts.evidenceRoot ?? defaultEvidenceRoot(repoRoot)
  const localCommand = buildLocalRunCommand(scenario.code, destination, acpAgent, model)
  const prompt = buildAcpPrompt({
    scenario: scenario.code,
    scenarioFile: scenario.file,
    destination,
    localCommand,
    acpAgent,
  })

  const env: Record<string, string> = {
    OPENADT_MCP_DESTINATION: destination,
    OPENADT_E2E_AGENT: acpAgent,
    OPENADT_E2E_EVIDENCE: '1',
    ACP_AGENT: acpAgent,
  }
  if (opts.model?.trim()) {
    env.OPENADT_E2E_MODEL = opts.model.trim()
  }

  const runId = dispatchRunId(testId)
  const dispatchedFrom = process.env.OPENADT_E2E_DISPATCHED_FROM?.trim() || 'cursor'

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
    destination,
    command: { local: localCommand },
    env,
    prompt,
    evidenceDir,
    skillPath: '.agents/skills/e2e/SKILL.md',
    specPath: 'specs/mcp-ai-testing.md',
    acpDocs: {
      agents: ACP_AGENTS_URL,
      getStarted: ACP_GET_STARTED_URL,
    },
    status: 'pending',
  }
}

export function writeDispatchFile(root: string, payload: E2eDispatchPayload): string {
  mkdirSync(root, { recursive: true })
  const path = join(root, `${payload.runId}.json`)
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  return path
}

export function formatDispatchInstructions(payload: E2eDispatchPayload): string {
  const dispatchPath = join(payload.repoRoot, '.e2e', 'dispatch', `${payload.runId}.json`)
  const lines = [
    'E2E dispatch — ACP external executor',
    '',
    `Run id:      ${payload.runId}`,
    `Scenario:    ${payload.scenario} (${payload.scenarioFile})`,
    `Destination: ${payload.destination}`,
    `ACP agent:   ${payload.acpAgent}`,
    `Dispatch:    ${dispatchPath}`,
    '',
    'Do not run bun locally in Cursor — hand off via Agent Client Protocol (ACP).',
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

export function runE2eDispatch(opts: CliOptions, repoRoot: string): RunE2eDispatchOutcome {
  try {
    const payload = buildE2eDispatch(opts, repoRoot)
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
