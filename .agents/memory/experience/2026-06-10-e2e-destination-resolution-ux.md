# E2E destination resolution UX friction

> Landscape ids omitted — live values live in `~/.adtls/destinations.json` only.

## Context
User ran `/e2e adt-1` with a **partial SID** only, expecting the agent to resolve it automatically. The matching row in `~/.adtls/destinations.json` used the full `SID_CLIENT_USER_LANG` form, not the short hint.

## Problem
- Partial input was not enough for the runner at the time; it needed the full id or explicit `--resolve-destination --system <partial-sid>`
- Skill/docs pushed agents to ask for full `SID_CLIENT_USER_LANG` or hand-add resolution flags
- No memory of last-used destination
- Agent could not infer the full id from partial input alone

## Resolution used
Manually added `--resolve-destination --system <partial-sid>` so the runner could look up the full destination id in the adtls store.

## User preference
User wants the agent/skill to handle destination choice — infer partial input or remember the last destination. Real landscape ids must not be hardcoded in repo docs, memory, or agent prompts.
