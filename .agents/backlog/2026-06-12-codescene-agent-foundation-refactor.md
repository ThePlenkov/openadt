# CodeScene delta refactor — agent foundation follow-up

**Status:** open
**Priority:** medium
**Source:** PR #89 CodeScene delta findings (18 threads on the new foundation code)

## Problem

PR #89 (`feat/agent-foundation-verb-stubs`) ships the agent foundation — a
~20k-line refactor that introduces new TypeScript modules in
`.agents/skills/e2e/`, `scripts/`, and `packages/adt-config/`,
`packages/adt-mcp/`, `packages/adt-lsp-mcp/`. The CodeScene "Delta Analysis"
gate flagged 18 complexity/duplication findings on the new code:

| File | Function | Biomarker | CC / detail |
| --- | --- | --- | --- |
| `.agents/skills/e2e/cli.ts` | `main` | Complex Method + Complex Conditional | CC 11 (cap 9) |
| `.agents/skills/e2e/scripts/framework/context.ts` | `parseCli` | Complex Method + Bumpy Road | CC 13 (cap 9) |
| `.agents/skills/e2e/scripts/framework/dispatch.ts` | `buildE2eDispatch` | Complex Method | CC 9 (cap 9) |
| `.agents/skills/e2e/scripts/framework/dispatch.ts` | `buildLocalRunCommand` | Excess Arguments | > 4 args |
| `.agents/skills/e2e/scripts/framework/execute.ts` | `runE2e` | Complex Method | CC 12 |
| `.agents/skills/e2e/scripts/framework/project-config.ts` | `loadProjectConfig` | Complex Method | CC 9+ |
| `e2e/openadt-adapter.ts` | `resolveDestinationId` | Complex Method | CC 26 |
| `e2e/openadt-adapter.ts` | (module) | Code Duplication | 4 similar message handlers |
| `scripts/verify-agent-memory.ts` | `scanAgentMemoryFile` | Complex Method + Bumpy Road | CC 14 |
| `scripts/verify-fixtures-only.ts` | `scanFile` | Complex Method + Bumpy Road | CC 13 |
| `packages/adt-config/src/config.ts` | `createDestinationProfile` / etc. | Complex Method + Large Method | CC + LoC > cap |
| `packages/adt-lsp-mcp/src/main.ts` | (handler block) | Complex Method | CC 10+ |
| `packages/adt-mcp/src/cli.ts` | `run` | Complex Method | CC 10+ |
| `packages/adt-mcp/src/mcp-stdio-entry.ts` | (entrypoint) | Complex Conditional | 3-branch |
| `packages/adt-mcp/src/mesh-server.ts` | `handleRequest` | Complex Method | CC 10+ |

## Why deferred from PR #89

The PR is the foundation work (transport contracts, MCP mesh, e2e
framework, destination resolution). All 18 findings are on **new** code
introduced in this PR — no pre-existing debt. The orchestrator rule
[`.kilo/rules/openadt-orchestrator.md` § "Design to 10.0 on the delta"]
explicitly warns against "trying to refactor inherited complexity in 3
pushes inside a feature PR"; these are not inherited, but the same logic
applies — splitting the refactor into its own PR keeps this one focused
on the feature contract.

## Plan

1. Open a follow-up PR (`refactor(codescene): clear delta findings on agent foundation`).
2. For each function: extract method (CC > 9), extract predicate (complex conditionals / bumpy road), or group args (excess arguments). CodeScene-ceiling contract in AGENTS.md.
3. Use the `codescene-fix` subagent with the `openadt-codescene` skill loaded for each function.
4. Verify locally with `bunx eslint scripts/ .agents/skills/ --max-warnings 0` and `bash scripts/ci-codescene-delta.sh origin/main HEAD` before pushing.
5. Close all 18 PR #89 review threads once the follow-up lands (resolve-only, with a back-link to the follow-up commit).

## Acceptance

- `cs delta origin/main HEAD --error-on-warnings` clean on the follow-up PR.
- `bunx eslint scripts/ .agents/skills/ --max-warnings 0` clean.
- All 18 PR #89 threads resolved.
