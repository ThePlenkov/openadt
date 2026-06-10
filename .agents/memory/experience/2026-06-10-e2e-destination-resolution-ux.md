# E2E destination resolution UX friction

## Context
User ran `/e2e adt-1 BHF` expecting the agent to handle destination resolution automatically. The actual destination ID in `~/.adtls/destinations.json` was `BHF_200_PPLENKOV_EN`, not just `BHF`.

## Problem
- User provided partial destination name (`BHF`) but e2e runner required full ID or explicit `--resolve-destination --system BHF` flag
- Current e2e skill requires agent to ask user for full `SID_CLIENT_USER_LANG` format or manually add resolution flags
- No memory of last-used destination
- Agent cannot intelligently guess destination from partial input or context

## Resolution used
Manually added `--resolve-destination --system BHF` to resolve partial system name to full destination ID from adtls store.

## User preference
User wants LLM/agent to decide destination via skill - either by guessing what user means from partial input, or remembering last-used destination. Destination identity should not be hardcoded by user or used by LLM.
