---
code: ls-23
id: atc-workflow
title: "ATC workflow: get variants, run check, load results"
tags: [atc, workflow]
mode: standalone
given: >-
  MCP stdio launcher runs in standalone mode with --no-proxy --import-from=adtls;
  user destination {{destination}} is registered and logon-ready.
when: >-
  Call adt_get_check_variants, adt_run_check, and adt_load_statement_results in sequence.
then: >-
  MCP returns tool results for each step;
  all isError flags are false; ATC workflow completes successfully.
steps:
  - tool: adt_get_check_variants
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/cl_abap_typedescr"
      quickPickUserInput: "*"
    assert:
      notError: true
  - tool: adt_run_check
    args:
      destination: "{{destination}}"
      uri: "/sap/bc/adt/oo/classes/cl_abap_typedescr"
      checkVariant: ""
    assert:
      notError: true
  - tool: adt_load_statement_results
    args:
      destination: "{{destination}}"
      measurementId: "MEASUREMENT_001"
    assert:
      notError: true
---

# ATC workflow: get variants, run check, load results

## Given

MCP stdio launcher runs in standalone mode with `--no-proxy --import-from=adtls`; destination `{{destination}}` is logon-ready.

## When

Call `adt_get_check_variants`, `adt_run_check`, and `adt_load_statement_results` in sequence.

## Then

- MCP tool responds with results for each step.
- All `isError` flags are false.
- ATC workflow completes successfully.

## Before you start

Ask the user for their **ADT destination id** (`SID_CLIENT_USER_LANG`). Do not assume any SID from the repo.

