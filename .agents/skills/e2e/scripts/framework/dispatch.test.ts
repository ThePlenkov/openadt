import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'
import { buildE2eDispatch, dispatchRunId, formatDispatchInstructions } from './dispatch'
import type { CliOptions } from './context'

const baseOpts = (): CliOptions => ({
  destination: 'ABC_100_USER_EN',
  resolveDestination: false,
  importFrom: 'adtls',
  port: 2239,
  timeoutMs: 300_000,
  scenario: 'mcp-1',
  list: false,
  evidence: true,
  agent: 'devin',
  executor: 'acp',
})

describe('dispatchRunId', () => {
  test('embeds scenario code and dispatch marker', () => {
    const id = dispatchRunId('mcp-1', new Date('2026-06-10T14:00:00.000Z'))
    expect(id).toMatch(/^2026-06-10T14-00-00Z-dispatch-mcp-1-[0-9a-f]{8}$/)
  })
})

describe('buildE2eDispatch', () => {
  test('builds ACP handoff payload', () => {
    const repoRoot = join(import.meta.dir, '..', '..', '..', '..')
    const payload = buildE2eDispatch(baseOpts(), repoRoot)
    expect(payload.executor).toBe('acp')
    expect(payload.acpAgent).toBe('devin')
    expect(payload.scenario).toBe('mcp-1')
    expect(payload.destination).toBe('ABC_100_USER_EN')
    expect(payload.command.local).toContain('bun run e2e -- mcp-1')
    expect(payload.command.local).toContain('--agent devin')
    expect(payload.prompt).toContain('mcp-1-list-destinations.md')
    expect(payload.env.ACP_AGENT).toBe('devin')
    expect(payload.status).toBe('pending')
  })

  test('requires scenario code', () => {
    const repoRoot = join(import.meta.dir, '..', '..', '..', '..')
    expect(() => buildE2eDispatch({ ...baseOpts(), scenario: undefined }, repoRoot)).toThrow(
      /requires a scenario/
    )
  })

  test('requires ACP agent id', () => {
    const repoRoot = join(import.meta.dir, '..', '..', '..', '..')
    expect(() => buildE2eDispatch({ ...baseOpts(), agent: undefined }, repoRoot)).toThrow(
      /requires --agent/
    )
  })
})

describe('formatDispatchInstructions', () => {
  test('is ACP-neutral', () => {
    const repoRoot = join(import.meta.dir, '..', '..', '..', '..')
    const payload = buildE2eDispatch(baseOpts(), repoRoot)
    const text = formatDispatchInstructions(payload)
    expect(text).toContain('ACP external executor')
    expect(text).toContain('agentclientprotocol.com')
    expect(text).toContain('devin')
    expect(text).not.toContain('devin -p')
  })
})
