---
code: adt-4
id: transport-assign
title: Assign transport to object
tags: [transport]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_assign_transport with destination {{destination}}, uri, and transportId.
then: >-
  MCP returns a tool result with transport assignment status;
  isError is false; response contains success information.
steps:
  - tool: adt_assign_transport
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/cl_abap_typedescr"
      transportId: ""
    assert:
      notError: true
---

# Assign transport to object

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_assign_transport` with destination, object URI, and transport ID.

## Then

- MCP tool responds with transport assignment status.
- `isError` is false.
- Response contains success information.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.
