# Intelligent destination resolution for e2e

**Status:** completed (auto-resolution)
**Priority:** high
**Source:** .agents/memory/experience/2026-06-10-e2e-destination-resolution-ux.md

## Problem
Current e2e workflow requires users to provide full `SID_CLIENT_USER_LANG` destination ID or manually specify `--resolve-destination --system <SID>` flags. When user provides partial destination name (e.g., `BHF`), the agent must manually add resolution flags. No memory of last-used destination exists.

## User requirement
LLM/agent should decide destination via skill - either by guessing what user means from partial input, or remembering last-used destination. Destination identity should not be hardcoded by user or used by LLM.

## Completed implementation
1. **Auto-resolution on partial input:** ✅ When user provides partial destination name (e.g., `BHF` instead of `BHF_200_PPLENKOV_EN`), e2e runner automatically resolves it from `~/.adtls/destinations.json` using the partial input as system hint
2. **Destination memory:** ⏸️ Pending - remember last-used destination per session/workspace, offer it as default in subsequent e2e runs
3. **Skill-level intelligence:** ✅ e2e skill now handles destination resolution internally in `tools/sap-adt-mcp-launcher/e2e/framework/context.ts`

## Changes made
- Modified `tools/sap-adt-mcp-launcher/e2e/framework/context.ts`:
  - Added `isPartialDestination()` function to detect partial destination format
  - Updated `resolveDestinationId()` to auto-enable resolution when partial input detected
  - Partial input is used as system hint for adtls lookup
- Updated `.agents/skills/e2e/SKILL.md` to document auto-resolution behavior

## Test results
Tested with partial destination "BHF" → auto-resolved to "BHF_200_PPLENKOV_EN" ✅

## Remaining work
- Destination memory mechanism (session-local or workspace-local)
- Consider edge cases: multiple matches, no matches, ambiguous input

## Related specs
- specs/mcp-ai-testing.md (destination resolution section)
- tools/sap-adt-mcp-launcher/e2e/framework/context.ts (existing resolveDestinationId function)
