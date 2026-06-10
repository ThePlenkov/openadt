---
code: adt-3
id: transport-create
title: Create transport for object
tags: [transport]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_create_transport with destination {{destination}}, uri, and transportId.
then: >-
  MCP returns a tool result with transport creation status;
  isError is false; response contains success information.
steps:
  - tool: adt_create_transport
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/zcl_example"
      transportId: "DEVK900000"
    assert:
      notError: true
---

# Create transport for object

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_create_transport` with destination, object URI, and transport ID.

## Then

- MCP tool responds with transport creation status.
- `isError` is false.
- Response contains success information.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.
