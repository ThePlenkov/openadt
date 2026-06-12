# MCP AI scenario testing

Live acceptance tests for **real SAP landscapes**. Scenarios live in `e2e/scenarios/` and never embed a system ID (SID) or destination id — the **agent user supplies** the target at run time.

**Framework:** generic [e2e-agent](../.agents/skills/e2e/SPEC.md) CLI (domain-agnostic). **OpenADT profile:** `e2e.config.yaml` + `e2e/openadt-adapter.ts` (SAP/MCP wiring).

## Goals

| Goal                  | Contract                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Agent-readable        | **One `scenarios/mcp-N-<id>.md` per scenario** — markdown body is the agent brief; YAML frontmatter holds machine `steps` |
| Landscape-agnostic    | Scenario files use placeholders only (`{{destination}}`, `{{pattern}}`); no real SIDs, usernames, or hostnames in git — fixtures `ABC`, `DEV` only |
| OpenADT `adt_*` focus | Default suite exercises OpenADT-owned tools; SAP `abap_*` scenarios are optional and separate                             |
| Real system           | Requires SAP ADT VS Code extension, `~/.adtls` logon (or `--import-from=openadt`), and SSO approval on cold start         |

## User-supplied context

The runner resolves placeholders from (first wins):

| Source              | Variable                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| CLI                 | `--destination <ADT_DESTINATION_ID>` (e.g. `ABC_200_USER_EN`)                                                              |
| Env                 | `OPENADT_MCP_DESTINATION`                                                                                                  |
| Env (optional hint) | `OPENADT_MCP_SYSTEM` — used only with `--resolve-destination` to pick the matching entry from `~/.adtls/destinations.json` |

`ADT_DESTINATION_ID` encodes SID, client, user, and language. The agent **asks the user** for this id (or runs `abap_list_destinations` first) — it is never committed in scenario files.

## Scenario file format

Path: `e2e/scenarios/<suite>/mcp-N-<id>.md` or `ls-N-<id>.md` — **one file per scenario**.

```markdown
---
code: mcp-2
id: read-standard-class
title: Read CL_ABAP_TYPEDESCR source
tags: [adt_read, smoke]
mode: standalone
given: >-
  MCP standalone stdio is connected; destination {{destination}} is active.
when: >-
  Call adt_read_object with destination {{destination}}, objectName CL_ABAP_TYPEDESCR.
then: >-
  MCP returns non-empty ABAP source; isError is false; text contains CL_ABAP_TYPEDESCR.
steps:
  - tool: adt_read_object
    args:
      destination: "{{destination}}"
      objectName: CL_ABAP_TYPEDESCR
      objectType: CLAS/OC
    assert:
      contentContains: CL_ABAP_TYPEDESCR
      notError: true
---

# Read standard class source

## Given / When / Then

(Same contract as frontmatter — for agents reading the markdown body.)
```

- **Frontmatter** (`---` delimited YAML): `code`, `id`, **`given` / `when` / `then`** (required TDD contract), `steps` for the runner.
- **Markdown body**: agent brief mirroring Given/When/Then plus setup notes.

### Scenario codes

| Code    | Purpose                    |
| ------- | -------------------------- |
| `mcp-1` | Destination list smoke     |
| `mcp-2` | `adt_read_object`          |
| `mcp-3` | `adt_search_objects`       |
| `mcp-4` | `adt_quick_search`         |
| `mcp-5` | `adt_get_inactive_objects` |

Codes are stable operator ids (issue trackers, agent prompts: _«run mcp-3»_). New scenarios take the next free `mcp-N` in `code` and filename `mcp-N-<id>.md` where `<id>` matches frontmatter `id`. The loader rejects filenames that do not match `code` + `id`. Slug `id` is also accepted for `--scenario` lookup.

### Assertions (machine checks)

| Key                   | Meaning                                                               |
| --------------------- | --------------------------------------------------------------------- |
| `contentContains`     | Tool text content includes substring (string or array — all required) |
| `notError`            | No MCP `isError` and no `"success":false` in JSON agent envelope      |
| `success`             | Agent envelope `success: true` when parseable                         |
| `minCount`            | Minimum length of `references` / `results` array in structured JSON   |
| `destinationsInclude` | `abap_list_destinations` output includes `{{destination}}`            |

## Runner (`e2e-agent` + OpenADT adapter)

Agents use **only** the generic CLI — see [.agents/skills/e2e/SKILL.md](../.agents/skills/e2e/SKILL.md). Default config: `e2e.config.yaml` at repo root.

```bash
bun run e2e -- list
bun run e2e -- show ls-1
bun run e2e -- run ls-1 --destination ABC
bun run e2e -- run mcp-1 --destination ABC_200_USER_EN
bun run e2e -- dispatch mcp-1 --destination ABC --acp --agent devin
```

| OpenADT param (→ adapter) | Meaning |
| ------------------------- | ------- |
| `--destination`           | Full id or partial SID (`ABC` → resolved via `~/.adtls/destinations.json`) |
| `--import-from`           | MCP launcher import mode (default `adtls`) |
| `--timeout-ms`            | Run budget (default `300000`) |
| `--port`                  | MCP launcher port (default `2239`) |

Framework flags (`--evidence`, `--agent`, `--model`, `--acp`): see [e2e SPEC](../.agents/skills/e2e/SPEC.md).

Suites (in `e2e.config.yaml`):

| Suite id | Prefix    | Backend        | Scenario dir              |
| -------- | --------- | -------------- | ------------------------- |
| `adtls`  | `ls-`     | `adt-lsp-mcp`  | `e2e/scenarios/adt-lsp`   |
| `mcp`    | `mcp-`    | `mcp-launcher` | `e2e/scenarios/launcher`  |

Exit `0` when all steps pass; `1` on missing destination, spawn failure, or assertion failure.

### ACP dispatch

```bash
bun run e2e -- dispatch ls-1 --destination ABC --acp --agent devin
```

Stdout ends with `E2E_DISPATCH_FILE=<path>`. External agent runs `command.local` from the JSON payload. No ACP API is wired in this repo.

## `/e2e` entry (evidence)

```bash
/e2e ls-1 ABC   →   bun run e2e -- run ls-1 --destination ABC
```

- `run` always writes evidence to `.e2e/results/` and prints `E2E_EVIDENCE_FILE=`.
- With `--acp --agent <id>`, use `dispatch` — do not spawn SAP locally in Cursor.

### Evidence file (single markdown)

Path: `.e2e/results/<datetime>-<✅|❌>-<test_id>-<8hex>.md` (gitignored).

Filename uses single-codepoint **✅** (pass) or **❌** (fail) — safe on Windows 10+, macOS, and Linux.

One file per run. Structure:

| Section             | Content                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------- |
| Header              | PASS/FAIL, run id, duration, how executed (agent, model, execution mode)                |
| **Given**           | Precondition from scenario frontmatter (placeholders resolved)                          |
| **When**            | Action taken (tool + args)                                                              |
| **Then (expected)** | Acceptance criteria from scenario                                                       |
| **Actual**          | MCP replied?, `isError`, assertion table (expected vs actual), response payload excerpt |
| **Overall verdict** | Whether Then criteria were met                                                          |

Assertion table rows include: `mcp_replied`, `mcp_is_error`, plus each machine assert (`destinations_include`, `content_contains:…`, `min_count`, etc.).

`test_id` is the scenario `code`, or `mcp-1_mcp-2` when multiple scenarios run in one invocation.

## Agent workflow

1. Ask the user which SAP destination to test (or run `mcp-1` first).
2. Run `bun run e2e -- run <code> --destination <id-or-SID>` — do **not** import framework modules or generate runner scripts.
3. Report `E2E_EVIDENCE_FILE`, PASS/FAIL, Given/When/Then, assertion table on failure.

## CI

Not wired to default `bun run openadt:test` — live SAP + SSO required. Optional manual job: `workflow_dispatch` with secret-less runner env `OPENADT_MCP_DESTINATION` supplied by the operator.

## Related

- [mcp.md](mcp.md) — launcher contract
- [adt-agent-typescript.md](adt-agent-typescript.md) — `adt_*` tool reference
