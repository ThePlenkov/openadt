# Plan: OpenADT autonomous-agent foundation (LSP operation coverage)

> **Lead's framing.** The two source documents — [`specs/lsp-implementation-plan.md`](../specs/lsp-implementation-plan.md) and [`specs/lsp-operations-catalog.md`](../specs/lsp-operations-catalog.md) — describe the _right_ gap (LSP operations the SAP MCP server doesn't expose) but they collide with three things in the repo's product contract:
>
> 1. [`specs/mcp.md:1-3`](../specs/mcp.md:1) — "OpenADT does not implement MCP tools" (a banner, not a footnote).
> 2. [`specs/mcp.md:493-496`](../specs/mcp.md:493) — explicit "Out of scope: OpenADT-owned MCP tools".
> 3. [`DESIGN.md:11`](../DESIGN.md:11) — the SDD gate forbids merging code that is not described in `specs/`.
>
> The lead confirmed with the user that the goal is the **autonomous-agent foundation**: an agent needs to do things an interactive VS Code user does via the LSP extensions (lock/unlock, toggle version, ATC, format, references, diagnostics, quick search, transport, etc.) but cannot via the SAP MCP server. The plan is therefore:
>
> 1. **Spec-first**: update `specs/` to authorize a new product surface (one new spec, plus a `vision.md` line, plus `DESIGN.md` + `apps/ARCHITECTURE.md` rows).
> 2. **Same architectural pattern** that already exists for `TransportService` and the `TransportsCommand` — the precedent is in `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/services/`.
> 3. **One tool per Devin task** — small PRs, each with its own failing test, its own spec delta if any, and the full `verify` block green.
> 4. **MCP exposure is a thin shell**: an optional second HTTP MCP server (next to the SAP one) that mounts only our new tools. The SAP server stays untouched.
>
> The catalog's 18 tools are kept verbatim, but renamed to drop the implicit "MCP-only" framing and to live as both `openadt adt <verb>` CLI subcommands **and** `mcp__<server>__adt_<verb>` MCP tools. Each Devin task delivers both surfaces from the same Java service.

---

## 0. Strategy and constraints (read first; binding on every task)

| #   | Constraint                                                                                                                                                                                                                                                                                                                | Source                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| C1  | **Spec drives code.** Every PR that changes behavior must first update `specs/`. The PR is invalid if `bun scripts/verify-spec-sync.ts` fails.                                                                                                                                                                            | [`AGENTS.md` SDD gate](../AGENTS.md), [`DESIGN.md:11`](../DESIGN.md:11)               |
| C2  | **SDK transport required** for all `openadt adt …` subcommands. The CLI must reject non-SDK transports with a clear error (see [`AdtCommandSupport.requireSdkTransport`](../apps/openadt-cli/src/main/java/org/openadt/cli/AdtCommandSupport.java:45)).                                                                   | [`specs/cli.md`](../specs/cli.md), existing `FetchCommand`                            |
| C3  | **One Java service per domain.** Follow the `TransportService` precedent at `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/services/TransportService.java` (interface in `sap.adt.services`, handler registered with `SdkServiceRegistry`, CLI subcommand in `apps/openadt-cli/src/main/java/org/openadt/cli/`). | [`apps/ARCHITECTURE.md`](../apps/ARCHITECTURE.md) layering rules                      |
| C4  | **Each leaf package needs `package-info.java`.** `bun scripts/verify-package-docs.ts` is part of the verify block.                                                                                                                                                                                                        | [`.agents/skills/openadt-sdd/SKILL.md:13`](../.agents/skills/openadt-sdd/SKILL.md:13) |
| C5  | **CodeScene delta ≤ 10.0 on the first push.** Cyclomatic complexity ≤ 9, function LoC ≤ 70, file LoC ≤ 1000, args ≤ 4. Group args, extract predicates.                                                                                                                                                                    | [`AGENTS.md` Code Health section](../AGENTS.md)                                       |
| C6  | **Fictional fixtures only.** `DEV`, `dev-ms.example.com`, fake UUIDs. No real SAP hosts or secrets.                                                                                                                                                                                                                       | [`AGENTS.md` Rules](../AGENTS.md), [`specs/mcp.md` Security](../specs/mcp.md)         |
| C7  | **MCP server, if added, is _additive_.** It must not modify, fork, or replace the SAP MCP. It runs on a different port. The existing `openadt-mcp` launcher keeps owning the SAP side.                                                                                                                                    | [`specs/mcp.md`](../specs/mcp.md), [`specs/vision.md:27-29`](../specs/vision.md:27)   |
| C8  | **Devin budget.** Every task is one PR ≤ 400 LoC diff, with one spec delta (if any), one Java service, one CLI subcommand, one MCP tool, and unit tests. Big refactors are split.                                                                                                                                         | Operational rule for SWE 1.6                                                          |
| C9  | **3-push limit per task.** If a task isn't green after 3 pushes, stop and report.                                                                                                                                                                                                                                         | [`AGENTS.md` orchestrator rules](../AGENTS.md)                                        |

---

## 1. Spec changes (must land before any code) — Task T0

> All four edits below go in **one PR** so the SDD gate sees a consistent doc. Title: `docs(specs): authorize OpenADT agent-foundation tools (LSP operation coverage)`.

### T0.1 — New spec: `specs/adt-agent.md`

Authoring rules: follow the layout of `specs/cli.md` and `specs/sdk-services.md` (sections, table-based command reference, no time estimates). Required content:

| Section            | Required content                                                                                                                                                                                                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose & scope    | One paragraph: OpenADT exposes the operations an autonomous agent needs to drive ABAP development end-to-end, complementing (not replacing) the SAP MCP server. Scope = the 18 operations in the catalog minus the 6 already in SAP MCP.                                                                                                                            |
| Surface            | Two surfaces, both backed by the same Java service: (a) `openadt adt <verb>` CLI subcommands; (b) optional `openadt-mcp-agent serve` HTTP MCP server (separate port, separate Bearer, separate endpoint store).                                                                                                                                                     |
| Configuration      | Reuse `~/.openadt/config.toml` (`config.md`). Reuse `adt.transport = sdk` (no new keys for v1). MCP server: `--port`, `--token`, `--endpoint-store` flags; defaults differ from SAP server (port `2237`, store `~/.openadt/mcp-agent/endpoints/`).                                                                                                                  |
| Command reference  | One row per verb: name, syntax, input flags, output (stdout JSON or text), exit codes, transport requirement (`sdk` only). Pull the 18 verbs from the catalog table at [`specs/lsp-operations-catalog.md:262-296`](../specs/lsp-operations-catalog.md:262) — but mark the 6 already in SAP MCP as **Do not reimplement** (use `abap_*` tools from SAP MCP instead). |
| MCP tool reference | For each verb, tool name `adt_<verb>`, JSON schema (input + output), error schema (`{error, code, destination, message}`), tool name length ≤ 45 to fit Claude+Bedrock (formula in [`specs/mcp.md:382-410`](../specs/mcp.md:382)).                                                                                                                                  |
| Out of scope       | LSP-only operations (completion, code lens, debug, document highlight, dirty-state, AFF adapters). SDK services we know are not in the p2 bundle (flag for re-evaluation when SDK expands). Anything the SAP MCP server already covers — explicitly do not reimplement.                                                                                             |
| Security           | Endpoint store `0600`; Bearer token only in store; redacted in logs; fictional fixtures only.                                                                                                                                                                                                                                                                       |
| Tests              | The unit-test contract each service must satisfy: success path, error path, throttling path (where applicable), `transport ≠ sdk` rejection.                                                                                                                                                                                                                        |

### T0.2 — `specs/vision.md` delta

Add a new "Roadmap: agent foundation" subsection right under the existing "Roadmap: MCP" subsection ([line 27-29](../specs/vision.md:27)):

> **Roadmap: agent foundation.** The `openadt adt …` subcommands and the optional `openadt-mcp-agent` server expose the operations an autonomous agent needs (lock/unlock, ATC, format, references, diagnostics, quick search, transport, etc.) by wrapping the same `com.sap.adt.*` SDK the LSP extensions wrap. They complement the SAP MCP server (which covers activation, ABAP Unit, and object creation) — they do not replace it. See [`specs/adt-agent.md`](adt-agent.md).

### T0.3 — `specs/mcp.md` delta

Replace the "Out of scope" line at [`specs/mcp.md:493-496`](../specs/mcp.md:493):

> - ~~OpenADT-owned MCP tools (all tools come from SAP).~~ **OpenADT-owned MCP tools that duplicate existing SAP MCP tools.** Tools not in the SAP MCP are authorized by [`specs/adt-agent.md`](adt-agent.md) and live on a separate HTTP MCP server (`openadt-mcp-agent`).

Also add a new sub-section under the existing architecture:

> ### `openadt-mcp-agent` (optional second server)
>
> A second Bun/HTTP MCP server that exposes only the OpenADT-owned tools defined in [`specs/adt-agent.md`](adt-agent.md). It runs on a different port (default `2237`) and uses a separate endpoint store (`~/.openadt/mcp-agent/endpoints/`). It does not spawn `adt-lsc`; it talks to the local Java product via the same JCo/Secure Login stack the SDK uses. The existing `openadt-mcp` launcher is unchanged.

### T0.4 — `DESIGN.md` + `apps/ARCHITECTURE.md` deltas

- [`DESIGN.md:21-44`](../DESIGN.md:21) — add a `SUB["org.openadt.sap.adt.agent"]` node in the architecture diagram, fed by `org.openadt.sap.adt.sdk` and feeding the CLI.
- [`apps/ARCHITECTURE.md:16-28`](../apps/ARCHITECTURE.md:16) — add row `org.openadt.sap.adt.agent.* | [specs/adt-agent.md](../specs/adt-agent.md)`.
- [`DESIGN.md:53-62`](../DESIGN.md:53) — add row `adt-agent.md | CLI subcommands + agent MCP for LSP coverage`.

**Accept criteria for T0:**

- `bun scripts/verify-spec-sync.ts` green
- `bun scripts/verify-package-docs.ts` green (no new package yet, but row in ARCHITECTURE exists)
- `mvnw -q verify -Pdistribution` green (unchanged)
- The PR contains **no Java code** — docs only. This is a hard rule, the SDD gate enforces it.

---

## 2. Scaffolding — Task T1 (depends on T0 merged)

> Title: `feat(agent): scaffold org.openadt.sap.adt.agent core + openadt adt root subcommand`

**Why this lands before the verbs:** every verb task (T2..T19) needs a stable registry, a stable CLI parent, and a stable `--json` envelope. Locking the envelope once saves Devin from redoing the same wiring 18 times.

**Java (one new package, one new interface, one new registry helper):**

| Path                                                                              | Symbol                                                                                                            | Notes                                                                                                                                      |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/agent/AgentService.java`  | `interface AgentService<R> { String name(); AgentResult<R> execute(AgentContext ctx); }`                          | Single-method service interface, one per verb.                                                                                             |
| `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/agent/AgentContext.java`  | `record AgentContext(String destination, ISystemSession session, IProgressMonitor monitor, AgentRequest request)` | Mirrors how `TransportService` carries a session; reuses `com.sap.adt.*` types from the SDK.                                               |
| `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/agent/AgentResult.java`   | `record AgentResult<T>(boolean success, T data, AgentError error) { … }`                                          | Stable JSON envelope: `{ success, data?, error?: { code, message, destination } }`.                                                        |
| `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/agent/AgentError.java`    | `record AgentError(String code, String message)`                                                                  | Codes are a closed enum: `LOCKED_BY_OTHER`, `NO_TRANSPORT`, `NOT_FOUND`, `SDK_TRANSPORT_REQUIRED`, `INVALID_URI`, `THROTTLED`, `INTERNAL`. |
| `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/agent/AgentRegistry.java` | `class AgentRegistry`                                                                                             | Looks up a service by name; throws `IllegalArgumentException` for unknown names.                                                           |
| `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/agent/package-info.java`  | (javadoc)                                                                                                         | Cross-link to `specs/adt-agent.md`.                                                                                                        |

**CLI (one new subcommand parent + one `AdtCommandSupport` helper):**

| Path                                                                        | Symbol                                        | Notes                                                                                                                                        |
| --------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/openadt-cli/src/main/java/org/openadt/cli/adt/AdtCommand.java`        | `@Command(name = "adt", subcommands = { … })` | Parent; lists known verb subcommands explicitly (no reflective discovery — easier to grep, easier for `verify-spec-sync`).                   |
| `apps/openadt-cli/src/main/java/org/openadt/cli/adt/AdtCommandSupport.java` | (extends existing `AdtCommandSupport`)        | Adds `agentExecute(serviceName, args)` helper that resolves a destination, refuses non-SDK transport, runs the service, prints JSON or text. |

**Add `AdtCommand.class` to [`OpenAdtCommand.subcommands`](../apps/openadt-cli/src/main/java/org/openadt/cli/OpenAdtCommand.java:12).**

**Tests (`apps/openadt-sap-adt/src/test/java/org/openadt/sap/adt/agent/`):**

- `AgentRegistryTest.java` — registers two services, looks up by name, rejects unknown.
- `AgentResultJsonEnvelopeTest.java` — JSON round-trip; envelope is stable across success/failure.
- `AdtCommandSupportTransportTest.java` — refuses `transport=http` with a clear error; accepts `transport=sdk` and unset.
- Existing `TransportService` tests stay green.

**Accept criteria for T1:**

- All four test files pass.
- `./mvnw -q verify -Pdistribution` green.
- `bun run openadt:test` green.
- `openadt adt --help` shows the parent command with no verb subcommands yet (empty list under "Commands:").

---

## 3. The verb tasks — one per tool

> Each task is a self-contained PR. Order below is the **dependency order** (later tasks may depend on the registry/CLI from T1 and on shared utilities from earlier tasks). Devin should do them in the listed order and stop after each to wait for review. A single PR may group **2 closely related verbs** (e.g., `lock_object` + `unlock_object`) when they share 80 % of the wiring; the line count budget still applies.

### Shared conventions (apply to every verb task)

- **Java service** lives in `apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/agent/<domain>/<Verb>Service.java` (domain = `atc`, `lock`, `format`, `diagnostic`, `references`, `version`, `transport`, `repository`, `run`, `hover`, `symbols`, `coverage`, `meta`).
- **CLI subcommand** lives in `apps/openadt-cli/src/main/java/org/openadt/cli/adt/<verb>/<Verb>Command.java`.
- **MCP tool** is registered by the `AdtMcpAgentServer` (added in T20, not in T2..T19). Verb tasks **do not** touch MCP code — they only register the service with `AgentRegistry`. The MCP layer reads the registry.
- **Throttling**: any verb that calls a per-object ADT endpoint that the LSP throttles (format, diagnostics, references) wraps the call in `AgentThrottle.acquire(uri)` from T1 helpers.
- **URI handling**: every verb that takes a URI normalizes it through `AdtUriUtil.parse(uri)` (new helper in T1) — produces `{ type, name, package, rawUri }`. The raw URI is what gets passed to the SDK.
- **Error mapping**: any `AdtException` from the SDK is mapped to `AgentError` codes by `AgentErrorMapper` (T1 helper). Devin must not catch and rethrow raw SDK exceptions.
- **Tests**: unit tests use a mock `ISystemSession` (T1 ships `MockSapSession`) and assert the SDK call was made with the right URI. No live SAP calls in CI.

### Verb task index

| ID  | Verbs                                                                                           | Catalog priority | Spec clause                                                                   | Estimated complexity                  |
| --- | ----------------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------- | ------------------------------------- |
| T2  | `atc_get_variants`                                                                              | High             | [lsp-implementation-plan.md:17-70](../specs/lsp-implementation-plan.md:17)    | Low — read-only                       |
| T3  | `atc_run_check`                                                                                 | High             | [lsp-implementation-plan.md:17-70](../specs/lsp-implementation-plan.md:17)    | Medium — async + progress             |
| T4  | `lock_object`, `unlock_object`                                                                  | High             | [lsp-implementation-plan.md:72-97](../specs/lsp-implementation-plan.md:72)    | Low — small group, shared wiring      |
| T5  | `get_lock_status`                                                                               | Medium           | [lsp-operations-catalog.md:80](../specs/lsp-operations-catalog.md:80)         | Low                                   |
| T6  | `format_code`                                                                                   | High             | [lsp-implementation-plan.md:98-133](../specs/lsp-implementation-plan.md:98)   | Medium — pretty printer, multi-format |
| T7  | `get_diagnostics`                                                                               | High             | [lsp-implementation-plan.md:134-184](../specs/lsp-implementation-plan.md:134) | Medium — throttle, parse findings     |
| T8  | `find_references`                                                                               | High             | [lsp-implementation-plan.md:185-241](../specs/lsp-implementation-plan.md:185) | Medium                                |
| T9  | `toggle_version`                                                                                | High             | [lsp-implementation-plan.md:242-265](../specs/lsp-implementation-plan.md:242) | Low                                   |
| T10 | `check_transport_lock`                                                                          | High             | [lsp-implementation-plan.md:266-306](../specs/lsp-implementation-plan.md:266) | Low — read-only                       |
| T11 | `create_transport`                                                                              | High             | [lsp-implementation-plan.md:266-306](../specs/lsp-implementation-plan.md:266) | Medium — workbench vs customizing     |
| T12 | `assign_transport`                                                                              | High             | [lsp-implementation-plan.md:266-306](../specs/lsp-implementation-plan.md:266) | Low                                   |
| T13 | `search_transports`, `search_transports_advanced`                                               | Medium           | [lsp-implementation-plan.md:405-430](../specs/lsp-implementation-plan.md:405) | Medium — pair them                    |
| T14 | `quick_search`                                                                                  | High             | [lsp-implementation-plan.md:307-355](../specs/lsp-implementation-plan.md:307) | Medium — RIS query string             |
| T15 | `get_inactive_objects`                                                                          | Medium           | [lsp-implementation-plan.md:358-368](../specs/lsp-implementation-plan.md:358) | Low                                   |
| T16 | `run_application`                                                                               | Medium           | [lsp-implementation-plan.md:369-380](../specs/lsp-implementation-plan.md:369) | Medium — streaming output             |
| T17 | `get_hover`                                                                                     | Medium           | [lsp-implementation-plan.md:381-392](../specs/lsp-implementation-plan.md:381) | Low — markdown response               |
| T18 | `document_symbols`                                                                              | Medium           | [lsp-implementation-plan.md:393-404](../specs/lsp-implementation-plan.md:393) | Medium — recursive tree               |
| T19 | `get_coverage`, `load_statement_coverage`                                                       | Medium           | [lsp-implementation-plan.md:431-483](../specs/lsp-implementation-plan.md:431) | Medium — pair them                    |
| T20 | `refresh_object`, `get_object_name`, `get_package_name`, `get_folder_uri`, `get_external_links` | Low              | [lsp-implementation-plan.md:486-502](../specs/lsp-implementation-plan.md:486) | Low — group as `meta` package         |

> **Coverage of the catalog:** T2–T20 cover all 18 verbs the catalog lists as "to implement", with the six already-in-SAP-MCP ones explicitly left out per `specs/adt-agent.md` "Do not reimplement" table. After T20 the catalog table's "New MCP Tools to Implement" section is fully resolved except for items marked **N/A (LSP-only)** in the source catalog.

### Per-verb deliverable template (Devin fills this for every task)

```text
PR title: feat(agent): <verb> — <one-line>
Spec delta: <one paragraph in specs/adt-agent.md, or "none">
Java service:
  - apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/agent/<domain>/<Verb>Service.java
  - apps/openadt-sap-adt/src/main/java/org/openadt/sap/adt/agent/<domain>/package-info.java
CLI:
  - apps/openadt-cli/src/main/java/org/openadt/cli/adt/<verb>/<Verb>Command.java
  - register in apps/openadt-cli/.../adt/AdtCommand.java subcommands list
  - add flag table row in apps/openadt-cli/.../adt/<verb>/package-info.java
Tests:
  - <Verb>ServiceTest.java (mock session, success + 1 error path)
  - <Verb>CommandTest.java (picocli parse + transport-refused path)
  - JsonEnvelopeTest.java (success + error envelopes round-trip)
Acceptance:
  - ./mvnw -q verify -Pdistribution      → green
  - bun run openadt:test                 → green
  - bunx eslint scripts/ .agents/skills/ --max-warnings 0  → green (no JS changed)
  - bun scripts/verify-spec-sync.ts      → green
  - bun scripts/verify-package-docs.ts   → green
  - "openadt adt <verb> --help" shows correct flags
  - "openadt adt <verb> --transport http …" prints SDK_TRANSPORT_REQUIRED error
```

### Cross-cutting subtasks within each verb

| Subtask                           | What                                                                                              | Why                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Spec paragraph in `adt-agent.md`  | One paragraph + one row in the command table + one JSON schema snippet                            | SDD gate cannot pass otherwise                                   |
| `package-info.java`               | One Javadoc paragraph + `@see specs/adt-agent.md#<verb>`                                          | `verify-package-docs.ts` will fail otherwise                     |
| `AgentRegistry` self-registration | `@PostConstruct` or static `ServiceLoader` pattern that the T1 registry auto-discovers            | Avoid hand-wiring 18 service lookups                             |
| `--json` flag                     | All CLI subcommands accept `--json` to emit the stable envelope on stdout                         | Required by both humans and the MCP server                       |
| Throttle (verbs T6, T7, T8)       | Wrap the SDK call in `AgentThrottle.acquire(uri)`, token bucket of N=4 per destination per second | Avoids the "server overload" failure mode from the catalog notes |
| Cancellation                      | All long-running services accept `AgentContext.monitor().isCanceled()` and abort cleanly          | T16 (run_application) sets the pattern; the others follow        |

---

## 4. MCP surface — Task T21 (depends on T2..T20)

> Title: `feat(agent-mcp): expose openadt-mcp-agent server with agent tools only`

This is the second HTTP MCP server described in `specs/mcp.md` (added in T0.3). Scope:

| Path                                             | Symbol                                     | Notes                                                                                                                                                                                                            |
| ------------------------------------------------ | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools/openadt-mcp-agent/src/main.ts`            | CLI entry                                  | Mirrors `tools/sap-adt-mcp-launcher/src/main.ts` shape; new product `openadt-mcp-agent`.                                                                                                                         |
| `tools/openadt-mcp-agent/src/server.ts`          | `class AgentMcpServer`                     | Boots a Jetty/Streamable-HTTP MCP server on `--port` (default `2237`), with Bearer auth (default token = generated 16 bytes, same as SAP server).                                                                |
| `tools/openadt-mcp-agent/src/agent-bridge.ts`    | `class AgentBridge`                        | Reads the `AgentRegistry` from the running `openadt` Java process **via a local UNIX socket / named pipe** (`~/.openadt/mcp-agent/bridge.sock`). One `tools/call` → one CLI invocation → one JSON envelope back. |
| `tools/openadt-mcp-agent/src/endpoint-store.ts`  | (re-uses pattern from `endpoint-store.ts`) | New store dir: `~/.openadt/mcp-agent/endpoints/`.                                                                                                                                                                |
| `tools/openadt-mcp-agent/src/tool-name-limit.ts` | (re-uses pattern)                          | Same 45-char cap as the SAP server.                                                                                                                                                                              |
| `tools/openadt-mcp-agent/package.json`           | (new product)                              | Independent of `sap-adt-mcp-launcher`.                                                                                                                                                                           |

**Java side: a tiny `openadt adt bridge` subcommand** (Task T21 also includes a T21-Java sub-task) that opens a local socket, accepts `{"service": "<name>", "args": {...}}` lines, prints `{"success":..., "data":...}` lines. The MCP server proxies to this socket. This avoids the MCP server needing any SAP access — it stays a thin shell.

**Critical rules:**

- **Same hostname, different port.** No conflict with the SAP MCP server on `2236`.
- **No reuse of `adt-lsc`.** This server is Java + stdlib HTTP, not LSP.
- **Tool name budget:** `mcp__<serverKey>__adt_<verb> ≤ 64` (Bedrock). `adt_<verb>` names stay ≤ 45 chars so the default `openadt-mcp-agent` key fits.
- **Graceful shutdown:** if the Java bridge dies, the MCP server returns `INTERNAL` errors and the agent sees the failure — no zombie processes.

**Accept criteria for T21:**

- `openadt-mcp-agent serve --port 2237` accepts a Bearer-authenticated `POST /mcp` and replies to `tools/list` with exactly the 18 verbs registered.
- `tools/call adt_quick_search {"destination":"DEV","searchTerm":"Z*"}` invokes the Java service, returns the JSON envelope.
- `openadt-mcp list` still lists only the SAP endpoint on `2236`; `openadt-mcp-agent list` lists the agent endpoint on `2237`.
- README in `tools/openadt-mcp-agent/` mirrors the SAP launcher's README format.
- `./mvnw -q verify -Pdistribution` and `bun run openadt:test` both green.
- `bun test tools/openadt-mcp-agent/src` covers frame parse, auth rejection, tool dispatch, name-limit cap.

---

## 5. Phasing and PR cadence

| Phase   | Tasks   | Description                                   | Status gate                                                                                                            |
| ------- | ------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Phase A | T0      | Spec + vision + DESIGN + ARCHITECTURE updates | `verify-spec-sync` green, no Java diff                                                                                 |
| Phase B | T1      | Scaffolding (registry, CLI parent, helpers)   | `mvnw verify` green, `openadt adt --help` works                                                                        |
| Phase C | T2..T20 | One verb per PR (paired where noted)          | Each PR green; after T20, all 18 verbs available via `openadt adt <verb>`                                              |
| Phase D | T21     | `openadt-mcp-agent` server                    | Both `mvnw verify` and `bun test tools/openadt-mcp-agent` green; demo `tools/call` works against a fixture destination |

**Do not** start a verb task before T1 is merged. **Do not** start T21 before T2..T20 are merged.

---

## 6. Lead's review checklist (apply on every Devin PR)

For each PR Devin opens, the lead checks (in order):

1. **Spec delta is in the same PR.** No spec-only or code-only drift. (SDD gate.)
2. **One Java service, one CLI subcommand, tests, no more.** If a PR exceeds ~400 LoC diff, ask Devin to split.
3. **`AdtCommandSupport.requireSdkTransport` is called.** No `transport=http` path can call into a service.
4. **Errors map to `AgentError` codes**, never raw `AdtException` to the user.
5. **No new top-level package** beyond the one in `apps/ARCHITECTURE.md`. Adding `org.openadt.sap.adt.agent.meta` is fine; adding `org.openadt.foo` is not.
6. **No live SAP calls in CI.** Tests use `MockSapSession`.
7. **CodeScene delta is clean.** Cyclomatic complexity ≤ 9, file LoC ≤ 1000, function LoC ≤ 70. If a service comes in at 12 CC, the lead splits it before merge.
8. **No `tmp/` artifacts** in the commit. Mirror any research into `specs/`.
9. **Bearer token, log redaction, fictional fixtures** — all observed.
10. **Verify block** from [`AGENTS.md`](../AGENTS.md) is green on the latest SHA: `bun scripts/verify-spec-sync.ts`, `bun scripts/verify-package-docs.ts`, `mvnw -q verify -Pdistribution`, `bun run openadt:test`. The lead re-runs the gate on the PR's current SHA before approving.

If any check fails, lead sends Devin a **single, concrete fix** and re-reviews. If 3 pushes in, lead stops and reports.

---

## 7. Mapping back to the source documents

| Source                                                                                                              | What it proposed                                                            | What this plan does with it                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `specs/lsp-implementation-plan.md` — 18 services in `apps/openadt-sap-adt/.../atc/`, `.../lock/`, …, `.../version/` | Per-verb services with a single path                                        | Same services, but under a single parent package `org.openadt.sap.adt.agent.<domain>/` (cleaner imports, one registry, one error envelope) |
| `specs/lsp-implementation-plan.md` — Estimated effort (2-3 days, etc.)                                              | Time estimates (forbidden)                                                  | Removed; replaced with complexity tags (Low / Medium)                                                                                      |
| `specs/lsp-operations-catalog.md` — Already-Implemented table                                                       | Confirms 6 verbs are SAP MCP                                                | Re-stated in `specs/adt-agent.md` as "Do not reimplement" with explicit cross-reference                                                    |
| `specs/lsp-operations-catalog.md` — LSP-only (N/A) entries                                                          | Completion, code lens, debug, document highlight, dirty-state, AFF adapters | Carried into `specs/adt-agent.md` "Out of scope" verbatim                                                                                  |
| `specs/lsp-operations-catalog.md` — "Implementation Strategy" (3 phases)                                            | Phase 1/2/3 = priority order                                                | Same priority order, mapped to the task IDs T2..T20                                                                                        |

---

## 8. What the lead hands Devin next

After this plan is approved, the lead opens a **first Devin task** as a single, copy-pasteable prompt:

```text
Task T0 (docs only — no Java code):

Read plans/lsp-agent-foundation.md section 1 (Tasks T0.1..T0.4).

Make these four edits, all in one PR titled
"docs(specs): authorize OpenADT agent-foundation tools (LSP operation coverage)":

1. Create specs/adt-agent.md per T0.1 (purpose, surface, config, command
   reference for 18 verbs, MCP tool reference, out of scope, security, tests).
2. Append a "Roadmap: agent foundation" paragraph to specs/vision.md
   immediately under the existing "Roadmap: MCP" section.
3. In specs/mcp.md, replace the "OpenADT-owned MCP tools" line in the
   "Out of scope" list with the updated text from T0.3, and add the
   "openadt-mcp-agent" subsection under the existing architecture.
4. In DESIGN.md add SUB["org.openadt.sap.adt.agent"] to the mermaid
   architecture diagram; in apps/ARCHITECTURE.md add the
   org.openadt.sap.adt.agent.* row in the package table; in DESIGN.md
   spec index table add the adt-agent.md row.

Stop after this PR. Do not write Java code. Do not start T1.
Verify locally:
  bun scripts/verify-spec-sync.ts
  bun scripts/verify-package-docs.ts
  mvnw -q verify -Pdistribution
  bun run openadt:test
All four must be green. Report the PR URL back to the lead.
```

Devin executes, the lead reviews against the checklist in section 6, and the cycle continues task by task.
