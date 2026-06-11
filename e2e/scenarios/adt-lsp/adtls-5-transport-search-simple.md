---
code: adtls-5
id: transport-search-simple
title: Simple transport search
tags: [transport]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_search_transports_simple with destination {{destination}} and query.
then: >-
  MCP returns a tool result with transport list;
  isError is false; response contains transport information.
steps:
  - tool: adt_search_transports_simple
    args:
      destination: "{{destination}}"
      owner: "{{owner}}"
      function: "*"
    assert:
      notError: true
---

# Simple transport search

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_search_transports_simple` with destination and search query.

## Then

- MCP tool responds with transport list.
- `isError` is false.
- Response contains transport information.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.

