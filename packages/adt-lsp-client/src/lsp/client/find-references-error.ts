const NARROW_HINT =
  'the symbol is likely too heavily used (e.g. a global class/method); narrow to a local or less-referenced symbol.'

export function enrichFindReferencesError(err: unknown, timeoutMs: number): Error {
  const message = err instanceof Error ? err.message : String(err)
  if (/timed out|timeout/i.test(message)) {
    return new Error(`findReferences timed out after ${timeoutMs}ms — ${NARROW_HINT}`)
  }
  if (/internal error/i.test(message)) {
    return new Error(`findReferences failed (${message}) — ${NARROW_HINT}`)
  }
  return err instanceof Error ? err : new Error(message)
}
