---
code: mcp-4
id: quick-search
title: LSP quick search via adt_quick_search
tags: [adt_agent, search]
mode: standalone
given: >-
  MCP standalone stdio is running with agent registry wired; destination {{destination}} is active.
when: >-
  Call adt_quick_search with destination {{destination}}, searchTerm {{pattern}}, maxResults 5.
then: >-
  Agent JSON envelope has success:true; data.references has at least one ADT uri.
steps:
  - tool: adt_quick_search
    args:
      destination: "{{destination}}"
      searchTerm: "{{pattern}}"
      maxResults: 5
    assert:
      success: true
      minCount: 1
---

# mcp-4 — Agent quick search

Call OpenADT `adt_quick_search` (LSP `adtLs/repository/quickSearch`) on the live landscape.

Requires **standalone** MCP (`--standalone`) so the agent registry is wired.

## Given

Standalone MCP with agent tools; destination `{{destination}}` active.

## When

Call `adt_quick_search` with `searchTerm` `{{pattern}}`.

## Then

- `success: true` in agent envelope.
- At least one reference with `uri` under `/sap/bc/adt/...`.
