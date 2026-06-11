---
code: ls-25
id: transport-workflow
title: "Transport workflow: check lock, create, assign"
tags: [transport, workflow]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_check_transport_lock, adt_create_transport, and adt_assign_transport in sequence.
then: >-
  MCP returns tool results for each step;
  all isError flags are false; transport workflow completes successfully.
steps:
  - tool: adt_check_transport_lock
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/cl_abap_typedescr"
      transportId: "DEVK900000"
    assert:
      contentContains: "isTransportCheckSuccessful"
      notError: true
  - tool: adt_create_transport
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/cl_abap_typedescr"
      operationType: "MODIFICATION"
      description: "Test transport for ls-25 workflow"
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

# Transport workflow: check lock, create, assign

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_check_transport_lock`, `adt_create_transport`, and `adt_assign_transport` in sequence.

## Then

- MCP tool responds with results for each step.
- All `isError` flags are false.
- Transport workflow completes successfully.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.
