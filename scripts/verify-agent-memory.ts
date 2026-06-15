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

function findBannedSids(rel: string, line: string, lineNo: number, prefix: string): string[] {
  if (!BANNED_SIDS.test(line)) return []
  BANNED_SIDS.lastIndex = 0
  return [`${rel}:${lineNo} ${prefix} must not name real SIDs`]
}

function findNarrativeDestinationIds(rel: string, line: string, lineNo: number): string[] {
  const errors: string[] = []
  const re = new RegExp(ANY_DESTINATION_ID.source, 'g')
  while (re.test(line)) {
    errors.push(
      `${rel}:${lineNo} narrative memory must not contain destination ids — describe "partial/full id" instead`
    )
  }
  return errors
}

function findCliDestinationValues(rel: string, line: string, lineNo: number): string[] {
  if (!CLI_DESTINATION.test(line)) return []
  CLI_DESTINATION.lastIndex = 0
  return [`${rel}:${lineNo} narrative memory must not contain --destination values`]
}

function findE2eWithSid(rel: string, line: string, lineNo: number): string[] {
  if (!E2E_WITH_SID.test(line)) return []
  E2E_WITH_SID.lastIndex = 0
  return [`${rel}:${lineNo} narrative memory must not contain /e2e <code> <sid> examples`]
}

function scanNarrativeLine(rel: string, line: string, lineNo: number): string[] {
  return [
    ...findBannedSids(rel, line, lineNo, 'narrative memory'),
    ...findNarrativeDestinationIds(rel, line, lineNo),
    ...findCliDestinationValues(rel, line, lineNo),
    ...findE2eWithSid(rel, line, lineNo),
  ]
}

function scanFactsLine(rel: string, line: string, lineNo: number): string[] {
  return findBannedSids(rel, line, lineNo, 'facts')
}

type MemoryKind = 'narrative' | 'facts' | null

function classifyMemoryPath(rel: string): MemoryKind {
  if (NARRATIVE_PREFIXES.some((p) => rel.startsWith(p))) return 'narrative'
  if (rel.startsWith(FACTS_PREFIX)) return 'facts'
  return null
}

function scanLineByKind(rel: string, line: string, lineNo: number, kind: MemoryKind): string[] {
  if (line.includes('SID_CLIENT_USER_LANG')) return []
  if (kind === 'narrative') return scanNarrativeLine(rel, line, lineNo)
  if (kind === 'facts') return scanFactsLine(rel, line, lineNo)
  return []
}

export function scanAgentMemoryFile(rel: string, content: string): string[] {
  if (!rel.endsWith('.md')) return []
  if (rel === '.agents/memory/mental-models/agent-memory-landscape-redaction.md') return []
  const kind = classifyMemoryPath(rel)
  if (kind === null) return []

  const errors: string[] = []
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    errors.push(...scanLineByKind(rel, lines[i]!, i + 1, kind))
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
