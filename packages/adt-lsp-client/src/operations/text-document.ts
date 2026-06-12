import {
  diagnostic as diagnosticContract,
  documentSymbol,
  formatting,
  hover as hoverContract,
  references as referencesContract,
} from '@openadt/adt-lsp-contracts'
import { applyTextEdits } from '../lsp/client/apply-text-edits'
import { callLspContract } from '../lsp/client/call-lsp-contract'
import { enrichFindReferencesError } from '../lsp/client/find-references-error'
import {
  primeSemanticTokens,
  resolveLspPosition,
  withOpenDocument,
} from '../lsp/client/with-open-document'
import type { DestinationUri, LspTransport } from './types'

const FIND_REFERENCES_TIMEOUT_MS = 20_000

export async function getDocumentSymbols(transport: LspTransport, args: DestinationUri) {
  return withOpenDocument(transport, args, async (ctx) =>
    callLspContract(documentSymbol, transport, {
      textDocument: { uri: ctx.repotreeUri },
    })
  )
}

export async function getDiagnostics(transport: LspTransport, args: DestinationUri) {
  return withOpenDocument(transport, args, async (ctx) =>
    callLspContract(diagnosticContract, transport, {
      textDocument: { uri: ctx.repotreeUri },
    })
  )
}

export async function getHover(
  transport: LspTransport,
  args: DestinationUri & {
    position: { line: number; character: number }
    symbol?: string
  }
) {
  return withOpenDocument(transport, args, async (ctx) => {
    await primeSemanticTokens(transport, ctx.repotreeUri)
    const position = await resolveLspPosition(transport, ctx, {
      position: args.position,
      symbol: args.symbol,
    })
    return callLspContract(hoverContract, transport, {
      textDocument: { uri: ctx.repotreeUri },
      position,
    })
  })
}

export async function findReferences(
  transport: LspTransport,
  args: DestinationUri & {
    position?: { line: number; character: number }
    symbol?: string
    timeoutMs?: number
  }
) {
  if (!args.position && !args.symbol) {
    throw new Error('Provide position (0-based) or symbol name.')
  }

  const timeoutMs = args.timeoutMs ?? FIND_REFERENCES_TIMEOUT_MS

  try {
    return await withOpenDocument(transport, args, async (ctx) => {
      const position = await resolveLspPosition(transport, ctx, {
        position: args.position,
        symbol: args.symbol,
      })
      return callLspContract(
        referencesContract,
        transport,
        {
          textDocument: { uri: ctx.repotreeUri },
          position,
          context: { includeDeclaration: false },
        },
        { timeoutMs }
      )
    })
  } catch (err) {
    throw enrichFindReferencesError(err, timeoutMs)
  }
}

export async function formatDocument(
  transport: LspTransport,
  args: DestinationUri & {
    content?: string
    tabSize?: number
    insertSpaces?: boolean
  }
) {
  return withOpenDocument(
    transport,
    {
      destination: args.destination,
      uri: args.uri,
      textOverride: args.content,
    },
    async (ctx) => {
      const edits = await callLspContract(formatting, transport, {
        textDocument: { uri: ctx.repotreeUri },
        options: {
          tabSize: args.tabSize ?? 2,
          insertSpaces: args.insertSpaces ?? true,
        },
      })
      const list = Array.isArray(edits) ? edits : []
      return {
        edits: list,
        formatted: applyTextEdits(ctx.content, list),
      }
    }
  )
}

export { FIND_REFERENCES_TIMEOUT_MS }
