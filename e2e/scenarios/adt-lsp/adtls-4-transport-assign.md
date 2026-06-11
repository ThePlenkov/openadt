---
code: adtls-4
id: transport-assign
title: Create and assign transport to object
tags: [transport]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Create a transport for the object, then assign the object to that transport.
then: >-
  MCP returns success for both create and assign operations;
  isError is false for both steps.
steps:
  - tool: adt_create_transport
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/cl_abap_typedescr"
      operationType: "MODIFICATION"
      description: "Test transport for adt-4 scenario"
    assert:
      notError: true
    extract:
      transportId: "number"
  - tool: adt_assign_transport
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/cl_abap_typedescr"
      transportId: "{{transportId}}"
    assert:
      notError: true
---

# Create and assign transport to object

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Create a transport for the object, then assign the object to that transport.

## Then

- MCP tool responds with success for both create and assign operations.
- `isError` is false for both steps.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.

**Note**: This scenario creates a new transport and assigns the object to it. The transport ID from the create step is used for the assign step.

