---
name: e2e
description: >-
  Use when the user invokes /e2e or asks to run an MCP AI scenario (mcp-1, mcp-2, adt-1, …)
  against a live SAP landscape, collect test evidence as a single .md under .e2e/results/,
  and report pass/fail with Given/When/Then. Destination id is always supplied by the user.
  Supports --acp / --command=acp to delegate the SAP run to an ACP-compatible agent instead of local bun.
---

# /e2e

Run one MCP AI scenario on a **real** SAP system and write **one evidence file** under **`.e2e/results/`** (gitignored).

Spec: [specs/mcp-ai-testing.md](../../../specs/mcp-ai-testing.md)

## Scenario suites

| Suite | Codes | Scenario dir | Root entry | Package-local |
| ----- | ----- | ------------ | ---------- | ------------- |
| SAP ADT launcher | `mcp-1` … `mcp-5` | `tools/sap-adt-mcp-launcher/e2e/scenarios/` | `bun run e2e` | `bun run mcp:e2e` (needs `--evidence`) |
| ADT LSP MCP | `adt-1` … `adt-26` | `tools/adt-lsp-mcp/e2e/scenarios/` | `bun run adt:e2e` | `cd tools/adt-lsp-mcp && bun run mcp:e2e` (needs `--evidence`) |

**Do not cross suites:** dispatch rejects `mcp-*` on `adt:e2e` and `adt-*` on `e2e`.

## On `/e2e <code>`

Examples: `/e2e mcp-1`, `/e2e adt-2`, `/e2e adt-1 --acp --agent devin`

### 1. Resolve scenario

| Input | Meaning |
| ----- | ------- |
| `mcp-1` … `mcp-5` | Launcher scenario code → use § Launcher below |
| `adt-1` … `adt-26` | ADT LSP scenario code → use § ADT LSP below |
| slug `read-standard-class` | Also accepted (launcher) |

Read the scenario markdown under the suite's `e2e/scenarios/` dir — every scenario has **Given / When / Then** in frontmatter.

### 2. Ask for destination (required)

**Do not assume a SID or destination from git.**

Ask the user for **ADT destination id** (`SID_CLIENT_USER_LANG`), or:

- `OPENADT_MCP_DESTINATION` if already set in the session
- `--resolve-destination --system <SID>` when `~/.adtls/destinations.json` has a unique match

### 3. Choose executor

| User intent | Flags | Cursor agent action |
| ----------- | ----- | ------------------- |
| Run here (default) | *(none)* | Execute local `bun run e2e` or `bun run adt:e2e` — see §4 |
| Delegate via ACP (save Cursor credits) | `--acp`, `--command=acp`, `--command acp`, or `--executor acp` **plus** `--agent <acp-agent-id>` | **Do not** run e2e locally. Run dispatch and hand off via ACP — see §5 |

ACP agent ids are user-supplied (never hardcoded). Browse [agentclientprotocol.com/overview/agents](https://agentclientprotocol.com/overview/agents) — e.g. `devin`, `cursor`, `gemini-cli`, `opencode`.

---

## Launcher (`mcp-*`)

Run one scenario from `tools/sap-adt-mcp-launcher/e2e/scenarios/mcp-N-<id>.md`.

List catalog: `bun run mcp:e2e -- --list`

### 4. Run locally with evidence

Pass **who** ran the scenario so evidence distinguishes agent-orchestrated runs from bare CLI:

**IMPORTANT:** Detect the actual agent from environment/process context — do not hardcode. Check process tree or environment to identify whether running as `devin`, `cursor`, `windsurf`, or other agent.

```bash
OPENADT_E2E_AGENT=<actual-agent> OPENADT_E2E_MODEL=<your-model> bun run e2e -- mcp-1 --destination <USER_DESTINATION_ID>
```

Or flags (CLI wins over env): `--agent <actual-agent> --model <your-model>`. Use your **actual** model name when known (e.g. `Auto`, `composer-2.5-fast`) — do not hardcode a wrong model. Omit both for direct CLI runs (`agent: openadt-runner`).

```bash
bun run e2e -- mcp-1 --destination <USER_DESTINATION_ID>
```

The runner always enables `--evidence`. On completion stdout includes:

```text
Evidence written: <repo>/.e2e/results/<datetime>-✅-<test_id>-<hash>.md
E2E_EVIDENCE_FILE=<same path>  (❌ in filename when the run fails)
```

### 5. Dispatch via ACP (external executor)

When the user passes `--acp` (or `--command=acp`) **and** `--agent <acp-agent-id>`, **do not spawn MCP or burn Cursor credits** on the SAP SSO run.

```bash
bun run e2e -- mcp-1 --destination <USER_DESTINATION_ID> --acp --agent devin
```

Equivalent: `bun run e2e:dispatch -- mcp-1 --destination <USER_DESTINATION_ID> --acp --agent devin`

Or env fallback: `ACP_AGENT=devin bun run e2e -- mcp-1 --destination <USER_DESTINATION_ID> --acp`

Stdout includes:

- Human-readable ACP handoff (protocol links + pasteable prompt + `command.local`)
- `E2E_DISPATCH_FILE=<repo>/.e2e/dispatch/<run-id>.json`

Tell the user to submit the prompt through their ACP client targeting the chosen agent. The external agent executes `command.local` from the JSON payload and reports `E2E_EVIDENCE_FILE` when done.

**ACP gap:** no ACP CLI/API is wired in this repo — dispatch is a file + instructions contract only. See [Agent Client Protocol](https://agentclientprotocol.com/get-started/introduction).

---

## ADT LSP MCP (`adt-*`)

Direct stdio MCP (`tools/adt-lsp-mcp/`). Scenarios: `tools/adt-lsp-mcp/e2e/scenarios/adt-N-<id>.md`.

### 4. Run locally with evidence

**Always use root entry** — evidence is always on:

```bash
OPENADT_E2E_AGENT=<actual-agent> OPENADT_E2E_MODEL=<your-model> bun run adt:e2e -- adt-1 --destination <USER_DESTINATION_ID>
```

```bash
bun run adt:e2e -- adt-1 --destination <USER_DESTINATION_ID>
```

Root `adt:e2e` sets `OPENADT_E2E_EVIDENCE=1` and injects `--evidence` + `--evidence-dir`. On completion stdout includes `E2E_EVIDENCE_FILE=<path>`.

### 5. Dispatch via ACP

```bash
bun run adt:e2e -- adt-1 --destination <USER_DESTINATION_ID> --acp --agent devin
```

Equivalent: `bun run adt:e2e:dispatch -- adt-1 --destination <USER_DESTINATION_ID> --acp --agent devin`

External agent runs `command.local` from `.e2e/dispatch/<run-id>.json` (typically `OPENADT_E2E_AGENT=devin bun run adt:e2e -- adt-1 --destination <ID>`).

### Anti-pattern (Devin / external agents)

**Do not** use bare `devin -p` with package-local `bun run mcp:e2e` in `tools/adt-lsp-mcp` — that bypasses evidence. `devin -p` is not a substitute for this skill.

| Wrong | Right |
| ----- | ----- |
| `devin -p` + `cd tools/adt-lsp-mcp && bun run mcp:e2e -- --scenario adt-1 …` | `OPENADT_E2E_AGENT=devin bun run adt:e2e -- adt-1 --destination <ID>` |
| Package `mcp:e2e` without `--evidence` for agent runs | Root `bun run adt:e2e` |

Package-local only for framework debugging:

```bash
cd tools/adt-lsp-mcp && bun run build
cd tools/adt-lsp-mcp && bun run mcp:e2e -- --scenario adt-1 --destination <ID> --evidence
```

---

## 6. Report to user

**Local run** — reply with:

- **PASS / FAIL** and exit code
- **Evidence file** path
- **Given / When / Then** summary from the scenario
- Per-step **assertion table** highlights (which checks passed/failed)
- If FAIL: quote the failed row(s) — expected vs actual — not just "ok"

**ACP dispatch** — reply with:

- Dispatch file path (`E2E_DISPATCH_FILE`)
- Target ACP agent id (`--agent` / `acpAgent` in JSON)
- Pasteable prompt and `command.local`
- Reminder: evidence will appear under `.e2e/results/` after the ACP agent completes
- Do not claim PASS/FAIL until the external agent returns evidence

Do not paste full ABAP source or secrets. Use `OPENADT_MCP_REDACT=1` when sharing logs publicly.

## Evidence file format

Single markdown file: `.e2e/results/2026-06-10T13-45-00Z-✅-mcp-1-a1b2c3d4.md` (or `❌` on failure; `adt-1` for LSP scenarios)

Contains:

- How the run was executed (command, **agent**, **model/LLM**, execution mode, destination, MCP mode)
- **Given / When / Then** (resolved placeholders)
- Per step: MCP replied?, `isError`, assertion table, response payload excerpt
- Overall verdict

A bare `✓ tool — ok` is **not** sufficient evidence — the file must show *what* was checked and *what* came back.

## Prerequisites

- SAP ADT VS Code extension + `adt-lsc`
- Bun on PATH
- User logged on (SSO window may appear; timeout 300s default)
- For full `adt_*` agent tools: scenarios use `mode: standalone` (default in runner)
- ACP dispatch: an ACP-compatible client + agent from [the registry](https://agentclientprotocol.com/overview/agents)

## Related commands

| Command | Evidence |
| ------- | -------- |
| `bun run e2e -- mcp-1 …` | Yes — single `.md` in `.e2e/results/` |
| `bun run e2e -- mcp-1 … --acp --agent <id>` | Dispatch JSON only; evidence after ACP agent runs |
| `bun run e2e:dispatch -- …` | Same as dispatch path above |
| `bun run adt:e2e -- adt-1 …` | Yes — evidence always on |
| `bun run adt:e2e -- adt-1 … --acp --agent <id>` | Dispatch JSON; evidence after ACP agent runs |
| `bun run adt:e2e:dispatch -- …` | Same as adt dispatch path above |
| `bun run mcp:e2e -- …` (launcher or adt-lsp-mcp) | Only with `--evidence` or `OPENADT_E2E_EVIDENCE=1` |

## Agent-only execution

If the user prefers manual MCP: follow Given/When/Then in the scenario file, then write one evidence `.md` under `.e2e/results/` using the same naming convention and the same sections (actual assertion checks + response excerpt).
