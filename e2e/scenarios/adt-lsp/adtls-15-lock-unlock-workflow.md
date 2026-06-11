---
code: adtls-15
id: lock-unlock-workflow
title: Lock and unlock file workflow
tags: [filesystem, workflow]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_lock_file, adt_get_file_lock_status, and adt_unlock_file in sequence.
then: >-
  MCP returns tool results for each step;
  all isError flags are false; lock status changes correctly.
steps:
  - tool: adt_lock_file
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/zcl_example"
    assert:
      notError: true
  - tool: adt_get_file_lock_status
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/zcl_example"
    assert:
      notError: true
  - tool: adt_unlock_file
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/zcl_example"
    assert:
      notError: true
---

# Lock and unlock file workflow

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_lock_file`, `adt_get_file_lock_status`, and `adt_unlock_file` in sequence.

## Then

- MCP tool responds with lock status for each step.
- All `isError` flags are false.
- Lock status changes correctly.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.

