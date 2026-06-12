/**
 * Open a repotree document for text-document LSP queries (didOpen → fn → didClose).
 *
 * Mirrors VS Code / @marianfoo/adt-ls navigation flow with per-URI serialization so
 * concurrent calls on the same object do not close each other's documents mid-flight.
 */
import type { LspTransport } from './lsp-transport'
import { resolveRepotreeUri } from './resolve-repotree-uri'
import {
  closeRepotreeDocument,
  openRepotreeDocument,
  type RepotreeDocumentContext,
  type RepotreeDocumentOptions,
} from './repotree-document-io'

export type WithOpenDocumentOptions = RepotreeDocumentOptions
export type OpenDocumentContext = RepotreeDocumentContext

const uriTails = new Map<string, Promise<void>>()

function runExclusive<T>(uri: string, op: () => Promise<T>): Promise<T> {
  const prev = uriTails.get(uri) ?? Promise.resolve()
  const run = prev.then(op, op)
  const tail = run.then(
    () => {},
    () => {}
  )
  uriTails.set(uri, tail)
  tail.then(() => {
    if (uriTails.get(uri) === tail) uriTails.delete(uri)
  })
  return run
}

export async function withOpenDocument<T>(
  transport: LspTransport,
  options: WithOpenDocumentOptions,
  fn: (ctx: OpenDocumentContext) => Promise<T>
): Promise<T> {
  const repotreeUri = await resolveRepotreeUri(transport, options)
  return runExclusive(repotreeUri, async () => {
    const ctx = await openRepotreeDocument(transport, { ...options, uri: repotreeUri })
    try {
      return await fn(ctx)
    } finally {
      closeRepotreeDocument(transport, ctx.repotreeUri)
    }
  })
}

/** Prime semantic token cache — required before hover/documentHighlight on ABAP. */
export async function primeSemanticTokens(
  transport: LspTransport,
  repotreeUri: string
): Promise<void> {
  try {
    await transport.sendRequest('textDocument/semanticTokens/full', {
      textDocument: { uri: repotreeUri },
    })
  } catch {
    // best-effort (CDS/JSON may not need it)
  }
}

export type LspPosition = { line: number; character: number }

type DocumentSymbolNode = {
  name: string
  selectionRange: { start: LspPosition }
  children?: DocumentSymbolNode[]
}

function findSymbol(symbols: DocumentSymbolNode[], name: string): DocumentSymbolNode | undefined {
  const lower = name.toLowerCase()
  for (const symbol of symbols) {
    if (symbol.name?.toLowerCase() === lower) return symbol
    const child = symbol.children ? findSymbol(symbol.children, name) : undefined
    if (child) return child
  }
  return undefined
}

function findInSource(content: string, name: string): LspPosition | undefined {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`\\b${escaped}\\b`, 'i')
  const lines = content.split('\n')
  for (let line = 0; line < lines.length; line++) {
    const match = re.exec(lines[line] ?? '')
    if (match) return { line, character: match.index }
  }
  return undefined
}

function positionOfSymbol(content: string, hit: DocumentSymbolNode): LspPosition {
  const start = hit.selectionRange.start
  if (start.character > 0) return start
  const lineText = content.split('\n')[start.line] ?? ''
  const escaped = hit.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`\\b${escaped}\\b`, 'i').exec(lineText)
  return match ? { line: start.line, character: match.index } : start
}

/** Resolve a 0-based LSP position from an explicit position or symbol name. */
export async function resolveLspPosition(
  transport: LspTransport,
  ctx: OpenDocumentContext,
  input: { position?: LspPosition; symbol?: string }
): Promise<LspPosition> {
  if (input.position) return input.position
  if (!input.symbol) {
    throw new Error('Provide position (0-based line/character) or symbol name.')
  }

  const symbols =
    ((await transport.sendRequest('textDocument/documentSymbol', {
      textDocument: { uri: ctx.repotreeUri },
    })) as DocumentSymbolNode[] | null) ?? []

  const hit = findSymbol(symbols, input.symbol)
  if (hit) return positionOfSymbol(ctx.content, hit)

  const fromSource = findInSource(ctx.content, input.symbol)
  if (fromSource) return fromSource

  const names = symbols.flatMap((s) => [
    s.name,
    ...(s.children ? s.children.map((c) => c.name) : []),
  ])
  throw new Error(
    `Symbol "${input.symbol}" not found in outline or source. Declared symbols: ${
      names.slice(0, 40).join(', ') || '(none)'
    }.`
  )
}
