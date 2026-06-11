---
code: adtls-14
id: get-external-links
title: Get external links for object
tags: [filesystem]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_get_external_links with destination {{destination}} and object URI.
then: >-
  MCP returns a tool result with external links;
  isError is false; response contains link information.
steps:
  - tool: adt_get_external_links
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/cl_abap_typedescr"
    assert:
      notError: true
---

# Get external links for object

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_get_external_links` with destination and object URI.

## Then

- MCP tool responds with external links.
- `isError` is false.
- Response contains link information.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.

