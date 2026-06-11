import { describe, expect, test } from 'bun:test'
import {
  LSP_METHOD_FILESYSTEM_FORCE_REFRESH,
  LSP_METHOD_FILESYSTEM_READ_FILE,
  LSP_METHOD_REPOSITORY_GET_LS_URI,
} from '@openadt/adt-config'
import type { LspTransport } from './lsp-transport'
import { withOpenDocument } from './with-open-document'

describe('withOpenDocument', () => {
  test('opens document, runs callback, and didClose in finally', async () => {
    const calls: Array<{ method: string; params: unknown }> = []
    const notifications: Array<{ method: string; params: unknown }> = []
    const transport: LspTransport = {
      sendRequest: async (method, params) => {
        calls.push({ method, params })
        if (method === LSP_METHOD_REPOSITORY_GET_LS_URI) {
          return { uri: 'abap:/repotree-v1/DEV/cl_x.clas.abap' }
        }
        if (method === LSP_METHOD_FILESYSTEM_READ_FILE) {
          return { content: 'CLASS cl_x DEFINITION.' }
        }
        if (method === 'textDocument/documentSymbol') {
          return [{ name: 'cl_x', selectionRange: { start: { line: 0, character: 6 } } }]
        }
        return {}
      },
      sendNotification: (method, params) => {
        notifications.push({ method, params })
      },
    }

    const symbols = await withOpenDocument(
      transport,
      { destination: 'DEV', uri: '/sap/bc/adt/oo/classes/cl_x' },
      async (ctx) => {
        expect(ctx.content).toBe('CLASS cl_x DEFINITION.')
        return transport.sendRequest('textDocument/documentSymbol', {
          textDocument: { uri: ctx.repotreeUri },
        })
      }
    )

    expect(symbols).toHaveLength(1)
    expect(notifications.map((n) => n.method)).toEqual([
      'textDocument/didOpen',
      'textDocument/didClose',
    ])
    expect(calls.map((c) => c.method)).toContain(LSP_METHOD_FILESYSTEM_FORCE_REFRESH)
  })

  test('serializes concurrent calls on the same URI', async () => {
    const events: string[] = []
    const transport: LspTransport = {
      sendRequest: async (method) => {
        if (method === LSP_METHOD_REPOSITORY_GET_LS_URI) {
          return { uri: 'abap:/repotree-v1/DEV/cl_x.clas.abap' }
        }
        if (method === LSP_METHOD_FILESYSTEM_READ_FILE) {
          return { content: 'CLASS cl_x DEFINITION.' }
        }
        return {}
      },
      sendNotification: (method) => {
        events.push(method)
      },
    }

    const slow = withOpenDocument(
      transport,
      { destination: 'DEV', uri: 'abap:/repotree-v1/DEV/cl_x.clas.abap' },
      async () => {
        events.push('start-a')
        await new Promise((r) => setTimeout(r, 30))
        events.push('end-a')
        return 'a'
      }
    )

    const fast = withOpenDocument(
      transport,
      { destination: 'DEV', uri: 'abap:/repotree-v1/DEV/cl_x.clas.abap' },
      async () => {
        events.push('start-b')
        events.push('end-b')
        return 'b'
      }
    )

    await Promise.all([slow, fast])
    expect(events.indexOf('end-a')).toBeLessThan(events.indexOf('start-b'))
  })
})
