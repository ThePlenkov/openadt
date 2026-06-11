---
code: ls-9
id: find-references
title: Find references to object
tags: [references]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_find_references with destination {{destination}}, uri, and symbol name
  (a type/method in the class — not the class keyword itself).
then: >-
  MCP returns a tool result with reference list;
  isError is false; response contains reference information.
steps:
  - tool: adt_find_references
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/cl_abap_typedescr"
      symbol: "CL_ABAP_DATA_TYPE_HANDLE"
    assert:
      notError: true
---

# Find references to object

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_find_references` with destination, object URI, and **symbol name** (not the class keyword — heavily-used globals hang or fail).

## Then

- MCP tool responds with reference list.
- `isError` is false.
- Response contains reference information.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.

