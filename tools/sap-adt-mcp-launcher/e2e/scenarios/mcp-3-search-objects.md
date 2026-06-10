---
code: mcp-3
id: search-objects
title: Repository search via adt_search_objects
tags: [adt_read, search]
mode: standalone
given: >-
  MCP standalone stdio is connected to SAP; destination {{destination}} is active.
when: >-
  Call adt_search_objects with destination {{destination}}, pattern {{pattern}},
  maxResults 5.
then: >-
  MCP returns JSON with at least one entry in references/results; isError is false.
steps:
  - tool: adt_search_objects
    args:
      destination: "{{destination}}"
      pattern: "{{pattern}}"
      maxResults: 5
    assert:
      minCount: 1
      notError: true
---

# mcp-3 — Search repository objects

Run RIS quick search for `{{pattern}}` on the user destination. Proves search + backend connectivity.

## Given

MCP connected to `{{destination}}`.

## When

Call `adt_search_objects` with pattern `{{pattern}}`.

## Then

- At least one matching object in `references` / `results`.
- No tool error.
