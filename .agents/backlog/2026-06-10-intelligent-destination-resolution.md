# Intelligent destination resolution for e2e

**Status:** completed (auto-resolution)
**Priority:** high
**Source:** .agents/memory/experience/2026-06-10-e2e-destination-resolution-ux.md

> Landscape ids omitted from this item — verification used the operator's local `~/.adtls` store.

## Problem
E2e runs required a full `SID_CLIENT_USER_LANG` destination id or manual `--resolve-destination --system <partial-sid>`. Partial hints from the user did not resolve automatically. No last-used destination memory.

## User requirement
Agent/skill should resolve partial input (or remember last destination). Real ids stay out of git.

## Completed implementation
1. **Auto-resolution on partial input:** ✅ Partial `--destination` values that are not already full ids are resolved via `~/.adtls/destinations.json` using the hint as system filter
2. **Destination memory:** ⏸️ Pending — session/workspace default for repeat runs
3. **Skill-level intelligence:** ✅ Documented in e2e skill; wiring in OpenADT adapter (`e2e/openadt-adapter.ts`)

## Changes made
- OpenADT adapter: partial SID → lookup in adtls destinations file
- `.agents/skills/e2e/SKILL.md`: auto-resolution behavior

## Test results
Verified locally with a partial `--destination` hint against the operator's adtls store (specific ids not recorded here).

## Remaining work
- Destination memory mechanism (session-local or workspace-local)
- Edge cases: multiple matches, no matches, ambiguous partial input

## Related specs
- specs/mcp-ai-testing.md (destination resolution section)
- e2e/openadt-adapter.ts
