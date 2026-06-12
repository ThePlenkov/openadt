---
code: ls-12
id: get-package-name
title: Get package name from URI
tags: [filesystem]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_get_package_name with destination {{destination}} and object URI.
then: >-
  MCP returns a tool result with package name;
  isError is false; response contains package and success flag.
steps:
  - tool: adt_get_package_name
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/cl_abap_typedescr"
    assert:
      notError: true
---

# Get package name from URI

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_get_package_name` with destination and object URI.

## Then

- MCP tool responds with package name.
- `isError` is false.
- Response contains package and success flag.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.

