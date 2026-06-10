---
code: adt-22
id: run-check
title: Run ATC check
tags: [atc]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_run_check with destination {{destination}}, object URI, and check variant.
then: >-
  MCP returns a tool result with check results;
  isError is false; response contains check findings.
steps:
  - tool: adt_run_check
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/zcl_example"
      checkVariant: "DEFAULT"
    assert:
      notError: true
---

# Run ATC check

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_run_check` with destination, object URI, and check variant.

## Then

- MCP tool responds with check results.
- `isError` is false.
- Response contains check findings.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.
