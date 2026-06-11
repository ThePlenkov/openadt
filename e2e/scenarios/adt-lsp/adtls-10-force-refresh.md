---
code: adtls-10
id: force-refresh
title: Force refresh of object
tags: [filesystem]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_force_refresh with destination {{destination}} and object URI.
then: >-
  MCP returns a tool result with refresh status;
  isError is false; response contains success information.
steps:
  - tool: adt_force_refresh
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/cl_abap_typedescr"
    assert:
      notError: true
---

# Force refresh of object

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_force_refresh` with destination and object URI.

## Then

- MCP tool responds with refresh status.
- `isError` is false.
- Response contains success information.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.

