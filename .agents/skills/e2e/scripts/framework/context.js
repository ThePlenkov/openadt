import { readE2eAgentConfig, resolveRepoRoot } from './evidence'
export const DEFAULT_E2E_AGENT = 'e2e-runner'
export const DEFAULT_E2E_MODEL = '(none — deterministic runner)'
export const ACP_AGENTS_URL = 'https://agentclientprotocol.com/overview/agents'
export const ACP_GET_STARTED_URL = 'https://agentclientprotocol.com/get-started/introduction'
export const ACP_EXECUTOR_ALIASES = ['acp']
export function getCliFlag(argv, flag) {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === flag) {
      const next = argv[i + 1]
      return next && !next.startsWith('-') ? next : undefined
    }
    const prefix = `${flag}=`
    if (arg.startsWith(prefix)) {
      const value = arg.slice(prefix.length)
      return value.length > 0 ? value : undefined
    }
  }
  return undefined
}
const LOCAL_EXECUTOR_ALIASES = ['local', 'cursor', 'e2e-runner']
function isLocalExecutorAlias(norm) {
  return LOCAL_EXECUTOR_ALIASES.includes(norm)
}
function isAcpExecutorAlias(norm) {
  return ACP_EXECUTOR_ALIASES.includes(norm)
}
function resolveExecutorFromFlag(raw) {
  const norm = raw.toLowerCase().trim()
  if (isLocalExecutorAlias(norm)) return 'local'
  if (isAcpExecutorAlias(norm)) return 'acp'
  throw new Error(`Unknown executor "${raw}". Use acp (or --acp), or omit for local execution.`)
}
export function resolveE2eExecutor(argv) {
  if (argv.includes('--acp')) return 'acp'
  const raw = getCliFlag(argv, '--command') ?? getCliFlag(argv, '--executor')
  if (!raw) return 'local'
  return resolveExecutorFromFlag(raw)
}
export function resolveE2eAgent(opts) {
  return opts.agent?.trim() || DEFAULT_E2E_AGENT
}
/** ACP registry agent id for dispatch — user-supplied, never defaulted. */
export function resolveAcpAgent(opts) {
  const id = opts.agent?.trim() ?? process.env.ACP_AGENT?.trim()
  if (!id) {
    throw new Error(
      `ACP dispatch requires --agent <acp-agent-id> or env ACP_AGENT. ` + `See ${ACP_AGENTS_URL}`
    )
  }
  return id
}
export function resolveE2eModel(opts) {
  return opts.model?.trim() || DEFAULT_E2E_MODEL
}
export function resolveE2eExecution(agent) {
  return agent === DEFAULT_E2E_AGENT
    ? 'framework (deterministic tool calls, no LLM in loop)'
    : 'agent-orchestrated (LLM invoked runner; tool calls still deterministic via framework)'
}
function positionalScenario(argv) {
  for (const arg of argv) {
    if (arg.startsWith('-')) continue
    return arg
  }
  return undefined
}
export function parseCli(argv) {
  const get = (flag) => getCliFlag(argv, flag)
  // Parse arbitrary dynamic arguments (not framework flags)
  const args = {}
  const frameworkFlags = new Set([
    '--scenario',
    '--list',
    '--evidence',
    '--evidence-dir',
    '--agent',
    '--model',
    '--acp',
    '--command',
    '--executor',
    '--prompt',
    '--autoclean',
  ])
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg?.startsWith('--')) continue
    if (frameworkFlags.has(arg)) continue
    // Parse --flag=value or --flag value
    if (arg.includes('=')) {
      const [key, value] = arg.split('=', 2)
      const flagName = key.slice(2)
      args[flagName] = value
    } else {
      const flagName = arg.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('-')) {
        args[flagName] = next
        i++ // skip next arg
      } else {
        args[flagName] = true
      }
    }
  }
  // Read project config (TESTING.md frontmatter or .e2e-agent.yaml)
  const repoRoot = resolveRepoRoot(process.cwd())
  const projectConfig = readE2eAgentConfig(repoRoot)
  return {
    scenario: get('--scenario') ?? positionalScenario(argv),
    list: argv.includes('--list'),
    evidence: argv.includes('--evidence') || process.env.E2E_EVIDENCE === '1',
    evidenceRoot: get('--evidence-dir'),
    agent: get('--agent') ?? process.env.E2E_AGENT?.trim(),
    model: get('--model') ?? process.env.E2E_MODEL?.trim(),
    executor: resolveE2eExecutor(argv),
    prompt: get('--prompt'),
    autoclean:
      argv.includes('--autoclean') ||
      process.env.E2E_AUTOCLEAN === '1' ||
      projectConfig.autoclean === true,
    args,
  }
}
/**
 * Build RunContext from parsed CLI options.
 * AI agent maps user input to actual parameters using the skill spec.
 */
export function buildRunContext(opts) {
  return {
    ...opts.args,
    prompt: opts.prompt,
  }
}
//# sourceMappingURL=context.js.map
