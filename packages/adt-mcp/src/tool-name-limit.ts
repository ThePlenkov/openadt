import { createHash } from 'node:crypto'

/** Default max MCP tool name length exposed over stdio (before client prefix). */
export const DEFAULT_MAX_MCP_TOOL_NAME_LEN = 45
// Bedrock/Claude prefix budget: specs/mcp.md § Agent backend tool name limits

/** Minimum supported `maxLen` — keeps the `_x<hash>` suffix from overflowing. */
export const MIN_REGISTRY_MAX_LEN = 9

/** Upper bound for `OPENADT_MCP_MAX_TOOL_NAME` — Bedrock/Claude prefix (7) + name ≤ 64. */
export const MAX_MCP_TOOL_NAME_LEN_CEILING = 57

export function maxMcpToolNameLenFromEnv(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.OPENADT_MCP_MAX_TOOL_NAME?.trim()
  if (!raw) {
    return DEFAULT_MAX_MCP_TOOL_NAME_LEN
  }
  const parsed = Number.parseInt(raw, 10)
  return isAcceptableMaxToolNameLen(parsed) ? parsed : DEFAULT_MAX_MCP_TOOL_NAME_LEN
}

function isAcceptableMaxToolNameLen(parsed: number): boolean {
  if (!Number.isFinite(parsed)) {
    return false
  }
  if (parsed < 16) {
    return false
  }
  return parsed <= MAX_MCP_TOOL_NAME_LEN_CEILING
}

/** Maps long SAP tool names to shorter aliases for agent backends with name limits. */
export class ToolNameRegistry {
  private readonly toAlias = new Map<string, string>()
  private readonly fromAlias = new Map<string, string>()
  private readonly exposed = new Set<string>()
  private readonly maxLen: number

  constructor(maxLen: number) {
    this.maxLen = Math.max(MIN_REGISTRY_MAX_LEN, maxLen)
  }

  /** Original → exposed (alias when too long). Records the mapping. */
  exportName(original: string): string {
    if (original.length <= this.maxLen) {
      this.exposed.add(original)
      return original
    }
    const existing = this.toAlias.get(original)
    if (existing) {
      return existing
    }
    const alias = this.uniqueAlias(original)
    this.toAlias.set(original, alias)
    this.fromAlias.set(alias, original)
    this.exposed.add(alias)
    return alias
  }

  /** Exposed (alias) → original; identity when not an alias. */
  importName(exposed: string): string {
    return this.fromAlias.get(exposed) ?? exposed
  }

  private makeAlias(original: string): string {
    const hash = createHash('sha256').update(original).digest('hex').slice(0, 6)
    const suffix = `_x${hash}`
    const prefixLen = Math.max(1, this.maxLen - suffix.length)
    return `${original.slice(0, prefixLen)}${suffix}`
  }

  private uniqueAlias(original: string): string {
    const baseAlias = this.makeAlias(original)
    if (this.canClaim({ candidate: baseAlias, original })) {
      return baseAlias
    }
    for (let attempt = 1; attempt < 0x100; attempt++) {
      const candidate = this.attemptedAlias({ baseAlias, attempt })
      if (this.canClaim({ candidate, original })) {
        return candidate
      }
    }
    throw new Error(`ToolNameRegistry: alias space exhausted for ${original}`)
  }

  private attemptedAlias({ baseAlias, attempt }: { baseAlias: string; attempt: number }): string {
    const suffix = attempt.toString(16).padStart(2, '0')
    return `${baseAlias.slice(0, this.maxLen - suffix.length)}${suffix}`
  }

  private canClaim({ candidate, original }: { candidate: string; original: string }): boolean {
    if (this.fromAlias.get(candidate) === original) {
      return true
    }
    if (this.fromAlias.has(candidate)) {
      return false
    }
    return !this.exposed.has(candidate)
  }
}
