---
code: ls-8
id: run-application
title: Run ABAP application
tags: [application]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_run_application with destination {{destination}} and application URI.
then: >-
  MCP returns a tool result with application run status;
  isError is false; response contains run information.
steps:
  - tool: adt_run_application
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/programs/sap_start"
    assert:
      notError: true
---

# Run ABAP application

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_run_application` with destination and application URI.

## Then

- MCP tool responds with application run status.
- `isError` is false.
- Response contains run information.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.

