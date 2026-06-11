import { describe, expect, test } from 'bun:test'
import { parsePlatform, PLATFORM_BUILD_TARGETS, readArg } from './build-openadt-mcp-release.ts'

describe('parsePlatform', () => {
  test('accepts the 4 matrix values and maps each to a Bun --target', () => {
    for (const p of ['win-x64', 'linux-x64', 'darwin-arm64', 'darwin-x64']) {
      const got = parsePlatform(p)
      expect(got.platform).toBe(p)
      expect(got.bunTarget).toBe(PLATFORM_BUILD_TARGETS[p]!.bunTarget)
      // Bun compile targets use the `bun-<os>-<arch>` form.
      expect(got.bunTarget.startsWith('bun-')).toBe(true)
    }
  })

  test('rejects unknown values', () => {
    expect(() => parsePlatform('win32')).toThrow()
    expect(() => parsePlatform('linux-arm64')).toThrow()
    expect(() => parsePlatform('')).toThrow()
    expect(() => parsePlatform(undefined)).toThrow()
  })
})

describe('readArg', () => {
  test("preserves '=' in values (paths may contain '=')", () => {
    const original = [...process.argv]
    try {
      process.argv = [...original, '--out=/tmp/openadt=ci']
      expect(readArg('--out')).toBe('/tmp/openadt=ci')
    } finally {
      process.argv = original
    }
  })

  test('returns undefined when the flag is missing', () => {
    const original = [...process.argv]
    try {
      process.argv = original
      expect(readArg('--platform')).toBeUndefined()
    } finally {
      process.argv = original
    }
  })
})
