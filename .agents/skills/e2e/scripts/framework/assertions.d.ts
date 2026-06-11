import type { AssertCheck, ScenarioAssert } from './types'
export type ToolCallPayload = {
  contentText: string
  isError: boolean
  structured?: unknown
}
export type AssertVerdict = {
  ok: boolean
  detail: string
  checks: AssertCheck[]
}
export declare function extractToolPayload(result: unknown): ToolCallPayload
export declare function evaluateAssert(
  assert: ScenarioAssert | undefined,
  payload: ToolCallPayload
): AssertVerdict
//# sourceMappingURL=assertions.d.ts.map
