# MCP AI test playbook (for agents)

Each scenario is **one file** under `scenarios/*.md` with a stable **code** (`mcp-1` …).

## Scenario index

| Code      | File                                                                     | Focus                      |
| --------- | ------------------------------------------------------------------------ | -------------------------- |
| **mcp-1** | [mcp-1-list-destinations.md](./scenarios/mcp-1-list-destinations.md)     | `abap_list_destinations`   |
| **mcp-2** | [mcp-2-read-standard-class.md](./scenarios/mcp-2-read-standard-class.md) | `adt_read_object`          |
| **mcp-3** | [mcp-3-search-objects.md](./scenarios/mcp-3-search-objects.md)           | `adt_search_objects`       |
| **mcp-4** | [mcp-4-quick-search.md](./scenarios/mcp-4-quick-search.md)               | `adt_quick_search`         |
| **mcp-5** | [mcp-5-inactive-objects.md](./scenarios/mcp-5-inactive-objects.md)       | `adt_get_inactive_objects` |

Say _«run mcp-3»_ or open the matching `.md` file.

## Before you start

1. Ask the user for **destination id** (`SID_CLIENT_USER_LANG`).
2. Start MCP: `bun run mcp:stdio -- --standalone --import-from=adtls --destination <USER_DESTINATION>`
3. Approve SSO if prompted.

## Automated run

```bash
export OPENADT_MCP_DESTINATION="<USER_DESTINATION>"
bun run mcp:ai-tests                      # all
bun run mcp:ai-tests -- --scenario mcp-2  # one by code
```
