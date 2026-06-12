/**
 * Shared repotree document I/O for prewarm and withOpenDocument.
 */
import {
  LSP_METHOD_FILESYSTEM_FORCE_REFRESH,
  LSP_METHOD_FILESYSTEM_READ_FILE,
} from '@openadt/adt-config'
import type { LspTransport } from './lsp-transport'
import { resolveRepotreeUri } from './resolve-repotree-uri'

export type RepotreeDocumentOptions = {
  destination: string
  uri: string
  refreshRelated?: boolean
  textOverride?: string
}

export type RepotreeDocumentContext = {
  repotreeUri: string
  content: string
}

async function bestEffort(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[openadt-lsp] repotree ${label} skipped: ${message}`)
  }
}

export async function openRepotreeDocument(
  transport: LspTransport,
  options: RepotreeDocumentOptions
): Promise<RepotreeDocumentContext> {
  const repotreeUri = await resolveRepotreeUri(transport, options)
  const refreshRelated = options.refreshRelated ?? true

  await bestEffort('forceRefresh', () =>
    transport
      .sendRequest(LSP_METHOD_FILESYSTEM_FORCE_REFRESH, {
        uri: repotreeUri,
        refreshRelatedFiles: refreshRelated,
      })
      .then(() => undefined)
  )

  let content = options.textOverride
  if (content === undefined) {
    await bestEffort('readFile', async () => {
      const read = (await transport.sendRequest(LSP_METHOD_FILESYSTEM_READ_FILE, {
        uri: repotreeUri,
      })) as { content?: string }
      content = read?.content ?? ''
    })
    content = content ?? ''
  }

  if (transport.sendNotification) {
    transport.sendNotification('textDocument/didOpen', {
      textDocument: {
        uri: repotreeUri,
        languageId: 'abap',
        version: 1,
        text: content,
      },
    })
  }

  return { repotreeUri, content }
}

export function closeRepotreeDocument(transport: LspTransport, repotreeUri: string): void {
  if (!transport.sendNotification) return
  try {
    transport.sendNotification('textDocument/didClose', {
      textDocument: { uri: repotreeUri },
    })
  } catch {
    // best-effort
  }
}
