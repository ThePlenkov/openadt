import type { RunContext, ScenarioAssert } from './types'

const VARS = ['destination', 'pattern'] as const

export function substituteValue(value: unknown, ctx: RunContext): unknown {
  if (typeof value === 'string') {
    return substituteString(value, ctx)
  }
  if (Array.isArray(value)) {
    return value.map((v) => substituteValue(v, ctx))
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = substituteValue(v, ctx)
    }
    return out
  }
  return value
}

function substituteString(raw: string, ctx: RunContext): string {
  let out = raw
  for (const key of VARS) {
    out = out.replaceAll(`{{${key}}}`, ctx[key])
  }
  return out
}

export function substituteArgs(
  args: Record<string, unknown> | undefined,
  ctx: RunContext
): Record<string, unknown> {
  return (substituteValue(args ?? {}, ctx) as Record<string, unknown>) ?? {}
}

export function substituteAssert(
  assert: ScenarioAssert | undefined,
  ctx: RunContext
): ScenarioAssert | undefined {
  if (!assert) return undefined
  return substituteValue(assert, ctx) as ScenarioAssert
}

/** Redact destination id in logs when OPENADT_MCP_REDACT=1. */
export function redact(text: string, ctx: RunContext): string {
  if (process.env.OPENADT_MCP_REDACT !== '1') return text
  return text.replaceAll(ctx.destination, '<destination>')
}
