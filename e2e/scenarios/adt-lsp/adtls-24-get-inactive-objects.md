---
code: adtls-24
id: get-inactive-objects
title: Get inactive objects in package
tags: [activation]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_get_inactive_objects with destination {{destination}} and package.
then: >-
  MCP returns a tool result with inactive objects list;
  isError is false; response contains object information.
steps:
  - tool: adt_get_inactive_objects
    args:
      destination: "{{destination}}"
      package: "$TMP"
    assert:
      notError: true
---

# Get inactive objects in package

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_get_inactive_objects` with destination and package.

## Then

- MCP tool responds with inactive objects list.
- `isError` is false.
- Response contains object information.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.

