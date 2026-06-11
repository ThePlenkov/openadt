#!/usr/bin/env bun
/**
 * Stricter landscape checks for .agents/memory and .agents/backlog.
 * Narrative memory must omit ids — not substitute fixtures (see agent-memory-landscape-redaction.md).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const NARRATIVE_PREFIXES = [
  '.agents/memory/experience/',
  '.agents/memory/observations/',
  '.agents/memory/mental-models/',
  '.agents/backlog/',
]

const FACTS_PREFIX = '.agents/memory/facts/'

/** Any concrete ADT destination id, including fixtures — banned in narrative memory. */
const ANY_DESTINATION_ID = /\b[A-Z][A-Z0-9]{2}_\d{3}_[A-Za-z][A-Z0-9_]*_[A-Za-z]{2}\b/g

const CLI_DESTINATION = /--destination\s+\S+/g
const E2E_WITH_SID = /\/e2e\s+\S+\s+[A-Z][A-Z0-9]{2}\b/g
const BANNED_SIDS = /\b(?:BHF|S0D)\b/g

export function scanAgentMemoryFile(rel: string, content: string): string[] {
  if (!rel.endsWith('.md')) return []
  if (rel === '.agents/memory/mental-models/agent-memory-landscape-redaction.md') return []
  const errors: string[] = []
  const isNarrative = NARRATIVE_PREFIXES.some((p) => rel.startsWith(p))
  const isFacts = rel.startsWith(FACTS_PREFIX)
  if (!isNarrative && !isFacts) return []

  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (line.includes('SID_CLIENT_USER_LANG')) continue

    if (isNarrative) {
      if (BANNED_SIDS.test(line)) {
        errors.push(`${rel}:${i + 1} narrative memory must not name real SIDs`)
      }
      BANNED_SIDS.lastIndex = 0

      for (const _ of line.matchAll(ANY_DESTINATION_ID)) {
        errors.push(
          `${rel}:${i + 1} narrative memory must not contain destination ids — describe "partial/full id" instead`
        )
      }
      if (CLI_DESTINATION.test(line)) {
        errors.push(`${rel}:${i + 1} narrative memory must not contain --destination values`)
      }
      CLI_DESTINATION.lastIndex = 0
      if (E2E_WITH_SID.test(line)) {
        errors.push(`${rel}:${i + 1} narrative memory must not contain /e2e <code> <sid> examples`)
      }
      E2E_WITH_SID.lastIndex = 0
    }

    if (isFacts) {
      if (BANNED_SIDS.test(line)) {
        errors.push(`${rel}:${i + 1} facts must not name real SIDs`)
      }
      BANNED_SIDS.lastIndex = 0
    }
  }

  return errors
}

export function scanAgentMemoryPaths(root: string, relPaths: string[]): string[] {
  const errors: string[] = []
  for (const rel of relPaths) {
    if (!rel.startsWith('.agents/memory/') && !rel.startsWith('.agents/backlog/')) continue
    try {
      const content = readFileSync(join(root, rel), 'utf8')
      errors.push(...scanAgentMemoryFile(rel, content))
    } catch {
      /* untracked or missing */
    }
  }
  return errors
}
