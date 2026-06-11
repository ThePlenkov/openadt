---
code: ls-17
id: format
title: Format ABAP code
tags: [format]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_format with destination {{destination}}, uri, and code.
then: >-
  MCP returns a tool result with formatted code;
  isError is false; response contains formatted ABAP code.
steps:
  - tool: adt_format
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/cl_abap_typedescr"
      content: "REPORT ztest."
    assert:
      notError: true
---

# Format ABAP code

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_format` with destination, object URI, and code.

## Then

- MCP tool responds with formatted code.
- `isError` is false.
- Response contains formatted ABAP code.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.

