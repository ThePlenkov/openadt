---
date: 2026-06-11
tags: [memory, security, agents, landscape]
---

# Memory redaction — omit, never fictionalize

Agent memory (`.agents/memory/`, `.agents/backlog/`) is **ground truth about what happened**, not a second place for specs or fixtures.

## When redacting landscape data

| Do | Don't |
| --- | --- |
| Omit ids — "partial SID", "full `SID_CLIENT_USER_LANG` row in `~/.adtls`" | Swap a redacted real id for a fixture and leave it reading like history |
| Say "verified locally (ids not recorded)" | Invent a fixture "tested X → Y" line after scrubbing a live session |
| Keep the lesson (friction, bug, decision) | Keep identifiers that would let a stranger map your employer's SAP landscape |

**Redaction changes phrasing, not facts.** If you cannot tell the story without an id, drop the id and keep the narrative.

## Where fixtures belong

Fixture ids — **specs, tests, CLI help, product docs only.** Not experience, backlog, observations, or mental-models.

`facts/` may document the `SID_CLIENT_USER_LANG` **format** with a single syntax example when needed — not a session narrative.

## Before committing memory

1. No real SIDs, usernames in destination ids, hostnames, home paths, or corporate registry URLs.
2. No `--destination <value>` or `/e2e <code> <sid>` with concrete values in experience/backlog.
3. Run `bun scripts/verify-fixtures-only.ts` (includes agent-memory checks).
4. One-off scrub/audit helpers belong in **`./tmp/`** only — not `scripts/`, not system `/tmp` (see AGENTS.md rule 5).
