export type ScenarioMode = 'standalone' | 'shared'

export type ScenarioAssert = {
  contentContains?: string | string[]
  notError?: boolean
  success?: boolean
  minCount?: number
  destinationsInclude?: string
}

export type ScenarioStep = {
  tool: string
  args?: Record<string, unknown>
  assert?: ScenarioAssert
}

/** Stable operator id, e.g. `mcp-1` (see specs/mcp-ai-testing.md). */
export type ScenarioCode = `mcp-${number}`

export type Scenario = {
  code: ScenarioCode
  id: string
  /** Basename under `scenarios/`, e.g. `mcp-1-list-destinations.md`. */
  file: string
  title: string
  tags?: string[]
  mode?: ScenarioMode
  /** TDD — required in scenario frontmatter. */
  given: string
  when: string
  then: string
  intent: string
  steps: ScenarioStep[]
}

export type RunContext = {
  destination: string
  pattern: string
  importFrom: string
  port: number
  timeoutMs: number
}

export type AssertCheck = {
  name: string
  expected: string
  actual: string
  passed: boolean
}

export type StepResult = {
  tool: string
  ok: boolean
  detail: string
  durationMs?: number
  args?: Record<string, unknown>
  mcpReplied?: boolean
  isError?: boolean
  checks?: AssertCheck[]
  responseBody?: string
}

export type ScenarioResult = {
  code: ScenarioCode
  id: string
  title: string
  passed: boolean
  steps: StepResult[]
}
