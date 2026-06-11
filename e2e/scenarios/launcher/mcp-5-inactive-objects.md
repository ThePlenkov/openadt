---
code: mcp-5
id: inactive-objects
title: List inactive objects
tags: [adt_agent, activation]
mode: standalone
given: >-
  MCP standalone stdio is running with agent registry wired; destination {{destination}} is active.
when: >-
  Call adt_get_inactive_objects with destination {{destination}}.
then: >-
  Agent JSON envelope has success:true (empty inactive list is valid).
steps:
  - tool: adt_get_inactive_objects
    args:
      destination: "{{destination}}"
    assert:
      success: true
---

# mcp-5 — Inactive objects

Call `adt_get_inactive_objects` on the user destination. An empty list is OK — we only check that the LSP activation extension responds.

## Given

Standalone MCP with activation LSP; destination `{{destination}}` active.

## When

Call `adt_get_inactive_objects`.

## Then

- Agent envelope `success: true`.
- Count of inactive objects may be zero.
