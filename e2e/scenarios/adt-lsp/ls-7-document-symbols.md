---
code: ls-7
id: document-symbols
title: Get document symbols for file
tags: [document]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_document_symbols with destination {{destination}} and object URI.
then: >-
  MCP returns a tool result with document symbols;
  isError is false; response contains symbol information.
steps:
  - tool: adt_document_symbols
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/cl_abap_typedescr"
    assert:
      notError: true
---

# Get document symbols for file

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_document_symbols` with destination and object URI.

## Then

- MCP tool responds with document symbols.
- `isError` is false.
- Response contains symbol information.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.

