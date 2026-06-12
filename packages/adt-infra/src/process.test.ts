import { describe, expect, test } from 'bun:test'
import { sleep, isTruthyEnv } from './process'

describe('sleep', () => {
  test('resolves after specified time', async () => {
    const start = Date.now()
    await sleep(100)
    const elapsed = Date.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(90) // allow some tolerance
  })

  test('resolves immediately for 0ms', async () => {
    const start = Date.now()
    await sleep(0)
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(50)
  })
})

describe('isTruthyEnv', () => {
  test("returns true for '1'", () => {
    expect(isTruthyEnv('1')).toBe(true)
  })

  test("returns true for 'true'", () => {
    expect(isTruthyEnv('true')).toBe(true)
  })

  test("returns true for 'yes'", () => {
    expect(isTruthyEnv('yes')).toBe(true)
  })

  test('returns true for uppercase variants', () => {
    expect(isTruthyEnv('TRUE')).toBe(true)
    expect(isTruthyEnv('YES')).toBe(true)
  })

  test("returns false for '0'", () => {
    expect(isTruthyEnv('0')).toBe(false)
  })

  test("returns false for 'false'", () => {
    expect(isTruthyEnv('false')).toBe(false)
  })

  test("returns false for 'no'", () => {
    expect(isTruthyEnv('no')).toBe(false)
  })

  test('returns false for empty string', () => {
    expect(isTruthyEnv('')).toBe(false)
  })

  test('returns false for undefined', () => {
    expect(isTruthyEnv(undefined)).toBe(false)
  })

  test('trims whitespace', () => {
    expect(isTruthyEnv(' true ')).toBe(true)
    expect(isTruthyEnv(' 1 ')).toBe(true)
  })

  test('returns false for random strings', () => {
    expect(isTruthyEnv('random')).toBe(false)
    expect(isTruthyEnv('maybe')).toBe(false)
  })
})
