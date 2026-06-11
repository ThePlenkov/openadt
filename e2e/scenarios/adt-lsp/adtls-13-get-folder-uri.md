---
code: adtls-13
id: get-folder-uri
title: Get folder URI for object
tags: [filesystem]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_get_folder_uri with destination {{destination}}, package, and objectType.
then: >-
  MCP returns a tool result with folder URI;
  isError is false; response contains URI information.
steps:
  - tool: adt_get_folder_uri
    args:
      destination: "{{destination}}"
      package: "$TMP"
      objectType: "CLAS"
    assert:
      notError: true
---

# Get folder URI for object

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_get_folder_uri` with destination, package, and object type.

## Then

- MCP tool responds with folder URI.
- `isError` is false.
- Response contains URI information.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.

