export function substituteValue(value, ctx) {
  if (typeof value === 'string') {
    return substituteString(value, ctx)
  }
  if (Array.isArray(value)) {
    return value.map((v) => substituteValue(v, ctx))
  }
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = substituteValue(v, ctx)
    }
    return out
  }
  return value
}
function substituteString(raw, ctx) {
  let out = raw
  // Support dynamic parameter substitution via {{paramName}}
  const matches = raw.matchAll(/\{\{(\w+)\}\}/g)
  for (const match of matches) {
    const key = match[1]
    const value = ctx[key]
    if (value !== undefined) {
      out = out.replaceAll(`{{${key}}}`, String(value))
    }
  }
  return out
}
export function substituteArgs(args, ctx) {
  return substituteValue(args ?? {}, ctx) ?? {}
}
export function substituteAssert(assert, ctx) {
  if (!assert) return undefined
  return substituteValue(assert, ctx)
}
/** Redact destination id in logs when E2E_REDACT=1. */
export function redact(text, ctx) {
  if (process.env.E2E_REDACT !== '1') return text
  return text.replaceAll(ctx.destination, '<destination>')
}
//# sourceMappingURL=template.js.map
