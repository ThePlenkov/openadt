import { describe, expect, test } from 'bun:test'
import {
  LSP_METHOD_FILESYSTEM_FORCE_REFRESH,
  LSP_METHOD_FILESYSTEM_READ_FILE,
  LSP_METHOD_REPOSITORY_GET_LS_URI,
} from '@openadt/adt-config'
import type { LspTransport } from './lsp-transport'
import { isRepotreeUri, resolveRepotreeUri } from './resolve-repotree-uri'
import { prewarmRepotreeObject } from './prewarm-repotree-object'

describe('resolve-repotree-uri', () => {
  test('isRepotreeUri detects repotree-v1 URIs', () => {
    expect(isRepotreeUri('abap:/repotree-v1/DEV/foo.clas.abap')).toBe(true)
    expect(isRepotreeUri('/sap/bc/adt/oo/classes/cl_x')).toBe(false)
  })

  test('resolveRepotreeUri returns repotree URI unchanged', async () => {
    const uri = 'abap:/repotree-v1/DEV/foo.clas.abap'
    const transport: LspTransport = {
      sendRequest: async () => {
        throw new Error('getLsUri should not run')
      },
    }
    await expect(resolveRepotreeUri(transport, { destination: 'DEV', uri })).resolves.toBe(uri)
  })

  test('resolveRepotreeUri calls getLsUri for ADT paths', async () => {
    const calls: string[] = []
    const transport: LspTransport = {
      sendRequest: async (method, params) => {
        calls.push(method)
        expect(params).toEqual({
          destination: 'DEV',
          adtUri: '/sap/bc/adt/oo/classes/cl_x',
        })
        return { uri: 'abap:/repotree-v1/DEV/cl_x.clas.abap' }
      },
    }
    const result = await resolveRepotreeUri(transport, {
      destination: 'DEV',
      uri: '/sap/bc/adt/oo/classes/cl_x',
    })
    expect(result).toBe('abap:/repotree-v1/DEV/cl_x.clas.abap')
    expect(calls).toEqual([LSP_METHOD_REPOSITORY_GET_LS_URI])
  })
})

describe('prewarm-repotree-object', () => {
  test('runs getLsUri, forceRefresh, readFile, and didOpen', async () => {
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
        return {}
      },
      sendNotification: (method, params) => {
        notifications.push({ method, params })
      },
    }

    const result = await prewarmRepotreeObject(transport, {
      destination: 'DEV',
      uri: '/sap/bc/adt/oo/classes/cl_x',
    })

    expect(result.repotreeUri).toBe('abap:/repotree-v1/DEV/cl_x.clas.abap')
    expect(calls.map((c) => c.method)).toEqual([
      LSP_METHOD_REPOSITORY_GET_LS_URI,
      LSP_METHOD_FILESYSTEM_FORCE_REFRESH,
      LSP_METHOD_FILESYSTEM_READ_FILE,
    ])
    expect(calls[1]?.params).toEqual({
      uri: 'abap:/repotree-v1/DEV/cl_x.clas.abap',
      refreshRelatedFiles: true,
    })
    expect(notifications).toHaveLength(1)
    expect(notifications[0]?.method).toBe('textDocument/didOpen')
  })

  test('continues when forceRefresh fails', async () => {
    const transport: LspTransport = {
      sendRequest: async (method) => {
        if (method === LSP_METHOD_REPOSITORY_GET_LS_URI) {
          return { uri: 'abap:/repotree-v1/DEV/cl_x.clas.abap' }
        }
        if (method === LSP_METHOD_FILESYSTEM_FORCE_REFRESH) {
          throw new Error('refresh failed')
        }
        if (method === LSP_METHOD_FILESYSTEM_READ_FILE) {
          return { content: 'CLASS cl_x DEFINITION.' }
        }
        return {}
      },
      sendNotification: () => {},
    }

    await expect(
      prewarmRepotreeObject(transport, {
        destination: 'DEV',
        uri: 'abap:/repotree-v1/DEV/cl_x.clas.abap',
      })
    ).resolves.toEqual({ repotreeUri: 'abap:/repotree-v1/DEV/cl_x.clas.abap' })
  })
})
