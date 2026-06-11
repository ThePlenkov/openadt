import { type CliOptions } from './context'
import type { RunContext, Scenario, ScenarioResult } from './types'
export declare function resolveRepoRoot(start: string): string
export declare function defaultEvidenceRoot(repoRoot: string): string
/** Single-codepoint verdict markers — safe on Windows 10+, macOS, Linux (no ZWJ). */
export declare const EVIDENCE_PASS_MARK = '\u2705'
export declare const EVIDENCE_FAIL_MARK = '\u274C'
/** `<iso-datetime>-<✅|❌>-<test_id>-<8hex>` */
export declare function evidenceFileBase(
  testId: string,
  passed: boolean,
  at?: Date | string
): string
export declare function createEvidencePath(
  root: string,
  testId: string,
  passed: boolean,
  at?: Date | string
): {
  runId: string
  path: string
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
  serviceMode: string
}
export declare function writeEvidenceReport(input: EvidenceReportInput): void
/** Delete ALL old evidence files for a given scenario code before writing new evidence. */
export declare function autocleanOldEvidence(root: string, scenarioCode: string): void
export declare function shouldRedactDestination(): boolean
export declare function formatDestination(destination: string): string
export type E2eAgentConfig = {
  autoclean?: boolean
}
/** Read e2e-agent configuration from TESTING.md frontmatter or .e2e-agent.yaml */
export declare function readE2eAgentConfig(repoRoot: string): E2eAgentConfig
export type E2eSuiteMeta = {
  scenarioFilePrefix: string
  formatCommand: (scenarios: Scenario[], ctx: RunContext) => string
}
/** Default suite meta - implementations should provide their own */
export declare const DEFAULT_E2E_SUITE: E2eSuiteMeta
export {}
//# sourceMappingURL=evidence.d.ts.map
