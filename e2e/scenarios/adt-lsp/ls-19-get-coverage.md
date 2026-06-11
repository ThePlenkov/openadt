---
code: ls-19
id: get-coverage
title: Get code coverage information
tags: [coverage]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_get_coverage with destination {{destination}} and object URI.
then: >-
  MCP returns a tool result with coverage information;
  isError is false; response contains coverage data.
steps:
  - tool: adt_get_coverage
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/zcl_example"
    assert:
      notError: true
---

# Get code coverage information

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_get_coverage` with destination and object URI.

## Then

- MCP tool responds with coverage information.
- `isError` is false.
- Response contains coverage data.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.

