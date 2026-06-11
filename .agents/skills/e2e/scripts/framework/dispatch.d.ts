import type { CliOptions } from './context'
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
/** `<iso-datetime>-dispatch-<test_id>-<8hex>` */
export declare function dispatchRunId(testId: string, at?: Date): string
export declare function defaultDispatchRoot(repoRoot: string): string
export declare function buildE2eDispatch(
  opts: CliOptions,
  repoRoot: string,
  config: {
    e2eRoot: string
    runnerScript: string
    suite?: E2eSuiteMeta
    usageExample: string
    specPath?: string
  }
): E2eDispatchPayload
export declare function writeDispatchFile(root: string, payload: E2eDispatchPayload): string
export declare function formatDispatchInstructions(payload: E2eDispatchPayload): string
export type RunE2eDispatchOutcome = {
  exitCode: number
  dispatchPath?: string
}
export declare function runE2eDispatch(
  build: (opts: CliOptions, repoRoot: string, config: any) => E2eDispatchPayload,
  opts: CliOptions,
  repoRoot: string,
  config: any
): RunE2eDispatchOutcome
//# sourceMappingURL=dispatch.d.ts.map
