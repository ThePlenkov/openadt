---
code: adtls-21
id: get-check-variants
title: Get ATC check variants
tags: [atc]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_get_check_variants with destination {{destination}}.
then: >-
  MCP returns a tool result with check variants list;
  isError is false; response contains variant names.
steps:
  - tool: adt_get_check_variants
    args:
      destination: "{{destination}}"
    assert:
      notError: true
---

# Get ATC check variants

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_get_check_variants` with destination.

## Then

- MCP tool responds with check variants list.
- `isError` is false.
- Response contains variant names.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.

