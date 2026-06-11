import type { RunContext } from './types'
export declare const DEFAULT_E2E_AGENT = 'e2e-runner'
export declare const DEFAULT_E2E_MODEL = '(none \u2014 deterministic runner)'
export declare const ACP_AGENTS_URL = 'https://agentclientprotocol.com/overview/agents'
export declare const ACP_GET_STARTED_URL =
  'https://agentclientprotocol.com/get-started/introduction'
/** Who runs the scenario (local vs external ACP agent). */
export type E2eExecutor = 'local' | 'acp'
export declare const ACP_EXECUTOR_ALIASES: readonly ['acp']
export type CliOptions = {
  /** Framework behavior flags */
  scenario?: string
  list: boolean
  evidence: boolean
  evidenceRoot?: string
  agent?: string
  model?: string
  executor: E2eExecutor
  prompt?: string
  autoclean?: boolean
  /** Arbitrary dynamic arguments for AI interpretation (e.g., --destination=ABC, --user=foo) */
  args: Record<string, string | boolean | number>
}
export declare function getCliFlag(argv: string[], flag: string): string | undefined
export declare function resolveE2eExecutor(argv: string[]): E2eExecutor
export declare function resolveE2eAgent(opts: CliOptions): string
/** ACP registry agent id for dispatch — user-supplied, never defaulted. */
export declare function resolveAcpAgent(opts: CliOptions): string
export declare function resolveE2eModel(opts: CliOptions): string
export declare function resolveE2eExecution(agent: string): string
export declare function parseCli(argv: string[]): CliOptions
/**
 * Build RunContext from parsed CLI options.
 * AI agent maps user input to actual parameters using the skill spec.
 */
export declare function buildRunContext(opts: CliOptions): RunContext
//# sourceMappingURL=context.d.ts.map
