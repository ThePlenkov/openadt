# MCP AI scenario testing

Live MCP acceptance tests for **real SAP landscapes**. Scenarios live in `tools/sap-adt-mcp-launcher/e2e/` and never embed a system ID (SID) or destination id — the **agent user supplies** the target at run time.

## Goals

| Goal                  | Contract                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Agent-readable        | **One `scenarios/mcp-N-<id>.md` per scenario** — markdown body is the agent brief; YAML frontmatter holds machine `steps` |
| Landscape-agnostic    | Scenario files use placeholders only (`{{destination}}`, `{{pattern}}`); no `BHF`, `S0D`, or real hostnames in git        |
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

Path: `tools/sap-adt-mcp-launcher/e2e/scenarios/mcp-N-<id>.md` — **one file per scenario** (filename is `code` + slug `id` for sortable, readable names; e.g. `mcp-2-read-standard-class.md`).

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

## Runner

```bash
bun run mcp:e2e -- --destination ABC_200_USER_EN
bun run mcp:e2e -- --destination ABC_200_USER_EN --scenario mcp-2
bun run mcp:e2e -- --destination ABC_200_USER_EN --scenario read-standard-class
bun run mcp:e2e -- --resolve-destination --system ABC --list
```

| Flag                       | Default                                                           | Meaning                                                                                                                                                                    |
| -------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--destination`            | env `OPENADT_MCP_DESTINATION`                                     | Full ADT destination id                                                                                                                                                    |
| `--resolve-destination`    | off                                                               | Pick id from `~/.adtls/destinations.json` using `--system` + optional `--user` / `--client`                                                                                |
| `--scenario`               | all                                                               | Run one scenario by `code` (`mcp-2`) or slug `id`                                                                                                                          |
| `--list`                   | off                                                               | Print scenario catalog (intent summaries) and exit                                                                                                                         |
| `--import-from`            | `adtls`                                                           | Forwarded to MCP launcher                                                                                                                                                  |
| `--timeout-ms`             | `300000`                                                          | Whole run budget (SSO logon)                                                                                                                                               |
| `--evidence`               | off (on via `bun run e2e`)                                        | Write one `.md` report under `.e2e/results/`                                                                                                                               |
| `--evidence-dir`           | `<repo>/.e2e/results`                                             | Override evidence directory                                                                                                                                                |
| `--agent`                  | env `OPENADT_E2E_AGENT`, else `openadt-runner`                    | Who orchestrated the run (Cursor agent vs bare CLI)                                                                                                                        |
| `--model`                  | env `OPENADT_E2E_MODEL`, else `(none — deterministic MCP runner)` | LLM model when agent-orchestrated                                                                                                                                          |
| `--command` / `--executor` | `local` (default)                                                 | Who **runs** the SAP-backed scenario — see [Executor routing](#executor-routing)                                                                                           |
| `--acp`                    | off                                                               | Boolean alias for `--command=acp` / `--executor=acp`                                                                                                                       |
| `--agent` (ACP dispatch)   | env `ACP_AGENT`                                                   | **Required** with `--acp` — ACP registry agent id (e.g. `devin`, `cursor`); see [agentclientprotocol.com/overview/agents](https://agentclientprotocol.com/overview/agents) |

Exit `0` when all scenarios pass; `1` on missing destination, spawn failure, or assertion failure.

### Executor routing

When Cursor credits are limited, delegate the live SAP run to an external ACP-compatible agent instead of executing `bun run e2e` locally.

| `--command` / `--executor`    | `--acp` | `--agent`    | Behavior                                                                                                    |
| ----------------------------- | ------- | ------------ | ----------------------------------------------------------------------------------------------------------- |
| _(omit)_ / `local` / `cursor` | off     | —            | **Local** — `bun run e2e` spawns MCP and writes `.e2e/results/<run>.md`                                     |
| `acp`                         | on      | **required** | **Dispatch** — no local MCP spawn; writes `.e2e/dispatch/<run-id>.json` and prints ACP handoff instructions |

Dispatch entry points:

```bash
bun run e2e -- mcp-1 --destination ABC_200_USER_EN --acp --agent devin
bun run e2e -- mcp-1 --destination ABC_200_USER_EN --command=acp --agent cursor
ACP_AGENT=gemini-cli bun run e2e:dispatch -- mcp-1 --destination ABC_200_USER_EN --acp
```

On dispatch, stdout ends with `E2E_DISPATCH_FILE=<path>`. The JSON payload includes `executor: "acp"`, `acpAgent`, `command.local` (exact runner for the external agent), `prompt`, and `env` (including `ACP_AGENT`).

**ACP:** no ACP CLI or API is wired in this repo. The dispatch file is the handoff contract; operators submit `prompt` via an ACP client to the chosen agent (see [Agent Client Protocol](https://agentclientprotocol.com/get-started/introduction) and [agents overview](https://agentclientprotocol.com/overview/agents)). Full ACP automation is a future integration gap.

## `/e2e` entry (evidence)

Agent skill: [.agents/skills/e2e/SKILL.md](../.agents/skills/e2e/SKILL.md)

```bash
bun run e2e -- mcp-1 --destination ABC_200_USER_EN
bun run e2e -- mcp-1 --destination ABC_200_USER_EN --acp --agent devin
```

- Sets `OPENADT_E2E_EVIDENCE=1` and always passes `--evidence` on **local** runs.
- Positional first non-flag arg is the scenario code (`mcp-1`, …).
- On local completion prints `E2E_EVIDENCE_FILE=<path>` for agents.
- With `--acp` (or `--command=acp`) and `--agent <acp-agent-id>`, prints dispatch instructions and `E2E_DISPATCH_FILE=<path>` — **do not** spawn MCP locally in Cursor.

### `@openadt/adt-lsp-mcp` entry (evidence)

Direct LSP stdio MCP (`tools/adt-lsp-mcp/`). Scenarios: `tools/adt-lsp-mcp/e2e/scenarios/adt-N-<id>.md` (`adt-1` … `adt-26`).

```bash
bun run adt:e2e -- adt-1 --destination ABC_200_USER_EN
OPENADT_E2E_AGENT=cursor OPENADT_E2E_MODEL=Auto bun run adt:e2e -- adt-2 --destination ABC_200_USER_EN
bun run adt:e2e -- adt-1 --destination ABC_200_USER_EN --acp --agent devin
```

Package-local (evidence only with `--evidence` or `OPENADT_E2E_EVIDENCE=1`):

```bash
cd tools/adt-lsp-mcp && bun run build
cd tools/adt-lsp-mcp && bun run mcp:e2e -- --scenario adt-1 --destination ABC_200_USER_EN --evidence
```

- Root `bun run adt:e2e` sets `OPENADT_E2E_EVIDENCE=1` and always passes `--evidence` on **local** runs.
- Positional first non-flag arg is the scenario code (`adt-1`, …) or slug `id`.
- On local completion prints `E2E_EVIDENCE_FILE=<path>` for agents.
- With `--acp` and `--agent <acp-agent-id>`, prints dispatch instructions (`bun run adt:e2e:dispatch -- …` is equivalent). External agent runs `command.local` from `.e2e/dispatch/<run-id>.json`.

**Devin / external agents:** do **not** use bare `devin -p` with `bun run mcp:e2e` in `tools/adt-lsp-mcp` — that bypasses evidence. Use:

```bash
OPENADT_E2E_AGENT=devin bun run adt:e2e -- adt-1 --destination <ADT_DESTINATION_ID>
```

Or dispatch: `bun run adt:e2e -- adt-1 --destination <ID> --acp --agent devin` and submit the printed prompt via ACP.

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

1. Ask the user which SAP system / destination to test (or run `abap_list_destinations` after MCP start).
2. Export `OPENADT_MCP_DESTINATION` or pass `--destination`.
3. Run `bun run e2e -- mcp-N …` (evidence on) with `OPENADT_E2E_AGENT` / `OPENADT_E2E_MODEL` (or `--agent` / `--model`) when an LLM agent orchestrates the run **or** `bun run mcp:e2e` **or** open `e2e/scenarios/mcp-N-<id>.md` and follow the markdown body via MCP.
4. For full `adt_*` agent tools, use `mode: standalone` scenarios (launcher spawns with `--standalone`).
5. Report evidence file from `E2E_EVIDENCE_FILE` or `Evidence written:` line; cite assertion table rows on failure.

## CI

Not wired to default `bun run openadt:test` — live SAP + SSO required. Optional manual job: `workflow_dispatch` with secret-less runner env `OPENADT_MCP_DESTINATION` supplied by the operator.

## Related

- [mcp.md](mcp.md) — launcher contract
- [adt-agent-typescript.md](adt-agent-typescript.md) — `adt_*` tool reference
