---
code: ls-20
id: load-statement-results
title: Load statement coverage results
tags: [coverage]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_load_statement_results with destination {{destination}} and measurement ID.
then: >-
  MCP returns a tool result with statement results;
  isError is false; response contains statement coverage data.
steps:
  - tool: adt_load_statement_results
    args:
      destination: "{{destination}}"
      measurementId: "MEASUREMENT_001"
    assert:
      notError: true
---

# Load statement coverage results

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_load_statement_results` with destination and measurement ID.

## Then

- MCP tool responds with statement results.
- `isError` is false.
- Response contains statement coverage data.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.

