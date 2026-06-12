---
code: ls-26
id: search-read-workflow
title: "Search and read workflow: quick search, get folder URI, force refresh"
tags: [repository, workflow]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_quick_search, adt_get_folder_uri, and adt_force_refresh in sequence.
then: >-
  MCP returns tool results for each step;
  all isError flags are false; search-read workflow completes successfully.
steps:
  - tool: adt_quick_search
    args:
      destination: "{{destination}}"
      searchTerm: "Z*"
    assert:
      contentContains: "| Name | Type | Description |"
      notError: true
  - tool: adt_get_folder_uri
    args:
      destination: "{{destination}}"
      package: "$TMP"
      objectType: "CLAS"
    assert:
      notError: true
  - tool: adt_force_refresh
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/cl_abap_typedescr"
    assert:
      notError: true
---

# Search and read workflow: quick search, get folder URI, force refresh

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_quick_search`, `adt_get_folder_uri`, and `adt_force_refresh` in sequence.

## Then

- MCP tool responds with results for each step.
- All `isError` flags are false.
- Search-read workflow completes successfully.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.

