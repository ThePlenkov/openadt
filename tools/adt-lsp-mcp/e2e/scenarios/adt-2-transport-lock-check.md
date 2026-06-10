---
code: adt-2
id: transport-lock-check
title: Check if object requires transport
tags: [transport]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_check_transport_lock with destination {{destination}}, uri, and transportId.
then: >-
  MCP returns a tool result with transport lock status;
  isError is false; response contains lock information.
steps:
  - tool: adt_check_transport_lock
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/cl_abap_typedescr"
      transportId: "DEVK900000"
    assert:
      contentContains: "isTransportCheckSuccessful"
      notError: true
---

# Check if object requires transport

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_check_transport_lock` with destination, object URI, and transport ID.

## Then

- MCP tool responds with transport lock status.
- `isError` is false.
- Response contains lock information.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.
