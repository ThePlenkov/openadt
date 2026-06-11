---
name: e2e
description: >-
  Abstract AI-first testing framework for MCP scenarios. Supports dynamic parameter extraction from natural language prompts,
  scenario execution against live systems, and evidence collection. Framework is fully reusable and domain-agnostic.
  Use when the user invokes /e2e or asks to run an MCP AI scenario, collect test evidence as a single .md under .e2e/results/,
  and report pass/fail with Given/When/Then.
---

# /e2e - AI-First Testing Framework

Abstract, reusable framework for agentic testing of MCP tools and services. The skill provides commands for scenario execution and evidence collection.

## Commands

### `e2e-agent list <scenarios-dir>`
List all scenarios in a directory.

**Example:**
```bash
npx e2e-agent list ./e2e/scenarios
```

### `e2e-agent run <scenarios-dir> <code>`
Run a specific scenario by code.

**Example:**
```bash
npx e2e-agent run ./e2e/scenarios test-1
```

### `e2e-agent dispatch <config>`
Generate ACP dispatch payload for external execution.

**Example:**
```bash
npx e2e-agent dispatch ./dispatch-config.json
```

### `e2e-agent help`
Show help message.

## Framework Features

### Dynamic Parameter Substitution
- Template substitution supports any parameter via `{{paramName}}` syntax
- No hardcoded parameter names - fully abstract
- Parameters can be added dynamically to `RunContext`

### AI-First Parameter Extraction
- `extractParamsFromPrompt()` placeholder for LLM-based interpretation
- Accepts natural language prompts to extract scenario parameters
- `mergeExtractedParams()` merges AI-extracted parameters with context
- Currently returns empty object - implementations should override with actual AI

### Scenario Suites

Project-specific scenario suites are defined in `e2e/scenarios/<suite>/`. Each suite has its own entry point and scenario codes.

## On `/e2e <code>`

### 1. Resolve scenario

Read the scenario markdown under the suite's `e2e/scenarios/<suite>/` dir — every scenario has **Given / When / Then** in frontmatter.

### 2. AI maps user input to parameters

The AI agent's task is to:
- Read the skill spec and understand the framework
- Read the scenario (Given/When/Then, steps)
- Understand what the user wants from their natural language prompt
- Build a RunContext with the parameters needed for the scenario
- Use framework modules to load scenarios, substitute templates, evaluate assertions, and generate evidence

**The framework provides these building blocks:**
- `loadScenariosFromDir()` - Load scenarios from a directory
- `buildRunContext()` - Build execution context from CLI options
- `substituteArgs()` - Substitute `{{param}}` placeholders with context values
- `evaluateAssertions()` - Evaluate assertion checks against responses
- `writeEvidenceReport()` - Generate evidence markdown in `.e2e/results/`

The AI agent is responsible for:
- Interpreting user intent and mapping it to RunContext parameters
- Executing the actual tool/service calls (MCP, HTTP, etc.)
- Collecting responses and running assertions
- Generating evidence reports

### 3. Choose executor

| User intent | Action |
| ----------- | ------ |
| Run here (default) | Use framework modules to execute locally |
| Delegate via ACP | Use `dispatch.ts` to generate ACP payload, hand off |

ACP agent ids are user-supplied (never hardcoded).

---

## Running Scenarios

### Local Execution

The AI agent uses framework modules to execute scenarios:

1. **Load scenario**: Use `loadScenariosFromDir()` to load the scenario file
2. **Build context**: Create a RunContext with parameters (e.g., destination, user)
3. **Execute steps**: For each step, call the actual tool/service (MCP, HTTP, etc.)
4. **Evaluate assertions**: Use `evaluateAssertions()` to check responses
5. **Generate evidence**: Use `writeEvidenceReport()` to write `.e2e/results/<datetime>-✅-<test_id>-<hash>.md`

The agent is responsible for the actual service calls - the framework only provides utilities for loading, substitution, assertions, and evidence.

### ACP Dispatch (external executor)

When the user passes `--acp` (or `--command=acp`) **and** `--agent <acp-agent-id>`, **do not spawn MCP or burn Cursor credits** on the live system run.

```bash
<runner-entry> -- <scenario-code> --destination <DESTINATION_ID> --acp --agent devin
```

Equivalent: `<runner-entry>:dispatch -- <scenario-code> --destination <DESTINATION_ID> --acp --agent devin`

Or env fallback: `ACP_AGENT=devin <runner-entry> -- <scenario-code> --destination <DESTINATION_ID> --acp`

Stdout includes:

- Human-readable ACP handoff (protocol links + pasteable prompt + `command.local`)
- `E2E_DISPATCH_FILE=<repo>/.e2e/dispatch/<run-id>.json`

Tell the user to submit the prompt through their ACP client targeting the chosen agent. The external agent executes `command.local` from the JSON payload and reports `E2E_EVIDENCE_FILE` when done.

**ACP gap:** no ACP CLI/API is wired in this repo — dispatch is a file + instructions contract only. See [Agent Client Protocol](https://agentclientprotocol.com/get-started/introduction).

---

## Report to user

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

Do not paste full source or secrets. Use environment-specific redaction when sharing logs publicly.

## Evidence file format

Single markdown file: `.e2e/results/<datetime>-<✅|❌>-<test_id>-<hash>.md`

Contains:

- How the run was executed (command, **agent**, **model/LLM**, execution mode, destination, service mode)
- **Given / When / Then** (resolved placeholders)
- Per step: service replied?, error status, assertion table, response payload excerpt
- Overall verdict

A bare `✓ tool — ok` is **not** sufficient evidence — the file must show *what* was checked and *what* came back.

## Prerequisites

Project-specific prerequisites are defined by the consuming project. The AI agent should load and read the root project's `TESTING.md` file for project-specific details such as:

- Service identifier resolution (how to extract service identifiers from user prompt)
- Common service identifiers and endpoints
- Service client configuration and authentication
- Service launcher configuration

Common requirements may include:
- Service client or connector
- Runtime environment (e.g., Bun on PATH)
- User authentication/logon (if required by the service)
- For full agent tools: scenarios use `mode: standalone` (default in runner)
- ACP dispatch: an ACP-compatible client + agent from [the registry](https://agentclientprotocol.com/overview/agents)

## Configuration

The e2e-agent can be configured via project configuration files:

### Option 1: `.e2e-agent.yaml`
Create a `.e2e-agent.yaml` file in your project root:

```yaml
autoclean: true
```

### Option 2: TESTING.md frontmatter
Add configuration to the frontmatter of your `TESTING.md`:

```markdown
---
e2e-agent:
  autoclean: true
---
```

### Configuration precedence
1. CLI flags (highest priority)
2. Environment variables
3. Project configuration files (.e2e-agent.yaml or TESTING.md frontmatter)

### Available configuration options
- `autoclean`: Delete all old evidence files for a scenario before writing new evidence (default: false)

## Related commands

Project-specific commands are defined by the consuming project. Common patterns:

| Command | Evidence |
| ------- | -------- |
| `<root-entry> -- <scenario-code> …` | Yes — single `.md` in `.e2e/results/` |
| `<root-entry> -- <scenario-code> … --acp --agent <id>` | Dispatch JSON only; evidence after ACP agent runs |
| `<root-entry>:dispatch -- …` | Same as dispatch path above |
| Package-local entry (without evidence flag) | Only with `--evidence` or project-specific env var |

## Agent-only execution

If the user prefers manual service interaction: follow Given/When/Then in the scenario file, then write one evidence `.md` under `.e2e/results/` using the same naming convention and the same sections (actual assertion checks + response excerpt).
