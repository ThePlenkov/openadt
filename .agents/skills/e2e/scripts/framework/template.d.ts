import type { RunContext, ScenarioAssert } from './types'
export declare function substituteValue(value: unknown, ctx: RunContext): unknown
export declare function substituteArgs(
  args: Record<string, unknown> | undefined,
  ctx: RunContext
): Record<string, unknown>
export declare function substituteAssert(
  assert: ScenarioAssert | undefined,
  ctx: RunContext
): ScenarioAssert | undefined
/** Redact destination id in logs when E2E_REDACT=1. */
export declare function redact(text: string, ctx: RunContext): string
//# sourceMappingURL=template.d.ts.map
