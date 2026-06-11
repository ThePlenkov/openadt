---
code: adt-18
id: diagnostic
title: Get diagnostic information
tags: [diagnostic]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_diagnostic with destination {{destination}} and object URI.
then: >-
  MCP returns a tool result with diagnostic information;
  isError is false; response contains diagnostic data.
steps:
  - tool: adt_diagnostic
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/cl_abap_typedescr"
    assert:
      notError: true
---

# Get diagnostic information

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_diagnostic` with destination and object URI.

## Then

- MCP tool responds with diagnostic information.
- `isError` is false.
- Response contains diagnostic data.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.
