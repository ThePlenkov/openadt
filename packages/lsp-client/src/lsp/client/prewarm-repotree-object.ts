/**
 * Warm adt-lsc caches before text-document LSP calls (references, symbols, hover, …).
 *
 * Prefer {@link withOpenDocument} for full open → query → didClose lifecycle.
 */
import type { LspTransport } from './lsp-transport'
import { resolveRepotreeUri } from './resolve-repotree-uri'
import { openRepotreeDocument, type RepotreeDocumentOptions } from './repotree-document-io'

export type PrewarmRepotreeObjectOptions = RepotreeDocumentOptions & {
  /** Send textDocument/didOpen after readFile (default true). */
  openDocument?: boolean
}

export async function prewarmRepotreeObject(
  transport: LspTransport,
  options: PrewarmRepotreeObjectOptions
): Promise<{ repotreeUri: string }> {
  if (options.openDocument === false) {
    const repotreeUri = await resolveRepotreeUri(transport, options)
    return { repotreeUri }
  }

  const ctx = await openRepotreeDocument(transport, options)
  return { repotreeUri: ctx.repotreeUri }
}
