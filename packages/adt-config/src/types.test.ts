import { describe, expect, test } from 'bun:test'
import { DEFAULT_MCP_PORT, MARKETPLACE_URL, DEFAULT_IMPORT_FROM } from './types'

describe('types constants', () => {
  test('DEFAULT_MCP_PORT is 2236', () => {
    expect(DEFAULT_MCP_PORT).toBe(2236)
  })

  test('MARKETPLACE_URL is correct', () => {
    expect(MARKETPLACE_URL).toBe(
      'https://marketplace.visualstudio.com/items?itemName=SAPSE.adt-vscode'
    )
  })

  test("DEFAULT_IMPORT_FROM is 'adtls'", () => {
    expect(DEFAULT_IMPORT_FROM).toBe('adtls')
  })
})
