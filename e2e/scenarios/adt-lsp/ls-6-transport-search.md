---
code: ls-6
id: transport-search
title: Advanced transport search
tags: [transport]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_search_transports with destination {{destination}} and search parameters.
then: >-
  MCP returns a tool result with transport list;
  isError is false; response contains transport information.
steps:
  - tool: adt_search_transports
    args:
      destination: "{{destination}}"
      user: "DEVELOPER"
      request: "DEVK9*"
      project: "ZPROJECT"
    assert:
      notError: true
---

# Advanced transport search

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_search_transports` with destination and search parameters.

## Then

- MCP tool responds with transport list.
- `isError` is false.
- Response contains transport information.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.

