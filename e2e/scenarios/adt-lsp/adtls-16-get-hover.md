---
code: adtls-16
id: get-hover
title: Get hover information
tags: [hover]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_get_hover with destination {{destination}}, uri, and position.
then: >-
  MCP returns a tool result with hover information;
  isError is false; response contains hover text.
steps:
  - tool: adt_get_hover
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/cl_abap_typedescr"
      position: { line: 1, character: 0 }
    assert:
      notError: true
---

# Get hover information

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_get_hover` with destination, object URI, and position.

## Then

- MCP tool responds with hover information.
- `isError` is false.
- Response contains hover text.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.

