#!/usr/bin/env bun
/**
 * CI guard: SAP landscape identifiers in git must use repo fixtures only.
 * Contract: AGENTS.md rule 2, REVIEW.md, specs/mcp-ai-testing.md.
 */
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { scanAgentMemoryFile } from './verify-agent-memory'

const root = join(import.meta.dir, '..')

/** SIDs permitted in docs, tests, and examples. */
const ALLOWED_SIDS = new Set(['ABC', 'DEV'])

/** User segment permitted inside ADT destination ids (SID_CLIENT_USER_LANG). */
const ALLOWED_USERS = new Set(['USER', 'DEVELOPER', 'developer'])

const SKIP_SUFFIX = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.jar',
  '.class',
  '.woff',
  '.woff2',
])

/** ADT destination id: SID_CLIENT_USER_LANG */
const DESTINATION_ID = /\b([A-Z][A-Z0-9]{2})_(\d{3})_([A-Za-z][A-Z0-9_]*)_([A-Za-z]{2})\b/g

/** Partial SID passed to --destination (not a full id). */
const CLI_PARTIAL_SID = /--destination\s+([A-Z][A-Z0-9]{2})\b/g

/** Real machine-local home paths (not doc placeholders like /Users/<user>/). */
const HOME_PATH = /(?:[A-Z]:\\Users\\[a-zA-Z][a-zA-Z0-9._-]+\\|\/Users\/[a-zA-Z][a-zA-Z0-9._-]+\/)/g

function trackedFiles(): string[] {
  const out = execSync('git ls-files -z', { cwd: root, encoding: 'utf8' })
  return out.split('\0').filter(Boolean)
}

function scanFile(rel: string): string[] {
  if (SKIP_SUFFIX.has(rel.slice(rel.lastIndexOf('.')))) return []
  if (rel === 'scripts/verify-fixtures-only.ts') return []

  let content: string
  try {
    content = readFileSync(join(root, rel), 'utf8')
  } catch {
    return []
  }
  if (content.includes('\0')) return []

  const errors: string[] = []
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (line.includes('SID_CLIENT_USER_LANG')) continue

    for (const match of line.matchAll(DESTINATION_ID)) {
      const [full, sid, , user] = match
      const userKey = user!
      if (!ALLOWED_SIDS.has(sid!)) {
        errors.push(`${rel}:${i + 1} destination id uses non-fixture SID "${sid}" in ${full}`)
      } else if (!ALLOWED_USERS.has(userKey) && !ALLOWED_USERS.has(userKey.toUpperCase())) {
        errors.push(`${rel}:${i + 1} destination id uses non-fixture user "${user}" in ${full}`)
      }
    }

    for (const match of line.matchAll(CLI_PARTIAL_SID)) {
      const sid = match[1]!
      if (!ALLOWED_SIDS.has(sid)) {
        errors.push(`${rel}:${i + 1} --destination uses non-fixture SID "${sid}"`)
      }
    }

    for (const match of line.matchAll(HOME_PATH)) {
      errors.push(`${rel}:${i + 1} local home path leaked: ${match[0]}`)
    }
  }

  errors.push(...scanAgentMemoryFile(rel, content))
  return errors
}

const errors: string[] = []
for (const rel of trackedFiles()) {
  errors.push(...scanFile(rel))
}

if (errors.length > 0) {
  console.error('verify-fixtures-only failed — use ABC/DEV fixtures only (see AGENTS.md):\n')
  for (const e of errors) console.error(`  ${e}`)
  process.exit(1)
}

console.log('verify-fixtures-only: OK')
