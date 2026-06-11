---
code: adt-1
id: quick-search
title: Quick search in ABAP repository
tags: [smoke, repository]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_quick_search with destination {{destination}} and searchTerm pattern.
then: >-
  MCP returns a tool result with search results in markdown table format;
  isError is false; response contains search results table.
steps:
  - tool: adt_quick_search
    args:
      destination: "{{destination}}"
      searchTerm: "Z*"
    assert:
      contentContains: "| Name | Type | Description |"
      notError: true
  - tool: adt_quick_search
    args:
      destination: "{{destination}}"
      searchTerm: "Z*"
      format: "json"
    assert:
      contentContains:
        - "references"
        - "name"
        - "type"
      notError: true
  - tool: adt_quick_search
    args:
      destination: "{{destination}}"
      searchTerm: "Z*"
      format: "compact"
    assert:
      contentContains:
        - "("
        - ")"
      notError: true
  - tool: adt_quick_search
    args:
      destination: "{{destination}}"
      searchTerm: "CL_ABAP*"
      types: ["CLAS"]
      maxResults: 5
    assert:
      contentContains: "| Name | Type | Description |"
      notError: true
---

# Quick search in ABAP repository

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_quick_search` with destination `{{destination}}` and search term pattern (e.g., "Z\*").

## Then

- MCP tool responds with search results in markdown table format.
- `isError` is false.
- Response contains table header `| Name | Type | Description |`.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.
