/**
 * Session-level prewarm after logon — cheap RIS/repotree index touch.
 */
import { LSP_METHOD_REPOSITORY_QUICK_SEARCH } from '@openadt/adt-config'
import type { LspTransport } from './lsp-transport'

/** Best-effort quickSearch to warm RIS after destination logon. Never throws. */
export async function prewarmDestination(
  transport: LspTransport,
  destination: string
): Promise<void> {
  try {
    await transport.sendRequest(LSP_METHOD_REPOSITORY_QUICK_SEARCH, {
      destination,
      pattern: 'CL_*',
      maxResults: 1,
      types: ['CLAS'],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[openadt-lsp] destination prewarm skipped: ${message}`)
  }
}
