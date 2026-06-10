---
code: mcp-1
id: list-destinations
title: List logged-on destinations
tags: [smoke, abap_list]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call MCP tool abap_list_destinations with no arguments.
then: >-
  MCP returns a tool result (not a transport error); isError is false;
  response text lists ADT destinations and includes {{destination}}.
steps:
  - tool: abap_list_destinations
    args: {}
    assert:
      destinationsInclude: "{{destination}}"
      notError: true
---

# mcp-1 — List destinations

Confirm MCP is connected to SAP: the user-provided destination must appear in the list.

## Given

MCP stdio launcher runs in standalone mode with adtls import; destination `{{destination}}` is logon-ready.

## When

Call `abap_list_destinations` with no arguments.

## Then

- MCP tool responds with destination list text/JSON.
- `isError` is false.
- Response includes `{{destination}}`.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.
