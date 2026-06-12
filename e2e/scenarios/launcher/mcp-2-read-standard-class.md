---
code: mcp-2
id: read-standard-class
title: Read CL_ABAP_TYPEDESCR source
tags: [adt_read, smoke]
mode: standalone
given: >-
  MCP standalone stdio is connected to SAP; destination {{destination}} is active.
when: >-
  Call adt_read_object with destination {{destination}}, objectName CL_ABAP_TYPEDESCR,
  objectType CLAS/OC.
then: >-
  MCP returns non-empty ABAP source text; isError is false;
  source contains CL_ABAP_TYPEDESCR and class definition markers.
steps:
  - tool: adt_read_object
    args:
      destination: "{{destination}}"
      objectName: CL_ABAP_TYPEDESCR
      objectType: CLAS/OC
    assert:
      contentContains:
        - CL_ABAP_TYPEDESCR
        - class
      notError: true
---

# mcp-2 — Read standard class source

Verify `adt_read_object` returns ABAP source for **CL_ABAP_TYPEDESCR** on the destination the user gave you (`{{destination}}`).

## Given

MCP is connected; destination `{{destination}}` is active.

## When

Call `adt_read_object` with `objectName` `CL_ABAP_TYPEDESCR`, `objectType` `CLAS/OC`.

## Then

- Non-empty ABAP source returned.
- Text contains `CL_ABAP_TYPEDESCR`.
- No MCP tool error.

## Before you start

Destination id comes from the user only — never from scenario files or git.
