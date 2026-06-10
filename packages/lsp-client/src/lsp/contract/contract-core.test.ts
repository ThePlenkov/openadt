import { describe, expect, test } from 'bun:test'
import { type, lspEndpoint } from './contract-core'

describe('contract-core', () => {
  test('type function returns empty object', () => {
    const result = type<string>()
    expect(result).toEqual({})
  })

  test('lspEndpoint returns the input as const', () => {
    const spec = {
      method: 'test/method',
      types: {
        params: type<{ foo: string }>(),
        response: type<{ bar: number }>(),
      },
    }
    const result = lspEndpoint(spec)
    expect(result).toBe(spec)
  })

  test('lspEndpoint preserves type information', () => {
    const spec = {
      method: 'test/method',
      types: {
        params: type<{ foo: string }>(),
        response: type<{ bar: number }>(),
      },
    }
    const result = lspEndpoint(spec)
    expect(result.method).toBe('test/method')
    expect(result.types).toBeDefined()
  })
})
