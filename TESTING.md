# Testing in OpenADT

This document describes all testing approaches in the OpenADT project.

## E2E Testing Framework

OpenADT includes an abstract AI-first testing framework for scenario-based testing. The framework is fully reusable and domain-agnostic.

**⚠️ IMPORTANT:** E2E testing in this context means **actual real system usage**. This framework is intended for:
- Manual testing by developers
- AI-assisted testing via agents
- Verification against live systems

**Users must be careful:**
- Do not run E2E tests against production systems without explicit authorization
- Be aware that tests may create, modify, or delete real data
- Review scenarios before execution to understand their impact
- Use appropriate test environments (DEV, QA, etc.)

### Skill

For the complete framework specification, usage, and integration details, see the [e2e skill](.agents/skills/e2e/SKILL.md).

The skill provides:
- AI-first scenario execution
- Dynamic parameter extraction from natural language prompts
- Evidence collection and reporting
- ACP dispatch for external execution
- Template substitution for scenario parameters

### Using the Skill

Invoke via `/e2e` — the agent runs **`e2e-agent` CLI commands only** (see [SKILL.md](.agents/skills/e2e/SKILL.md)). Do not import `scripts/framework/*`.

```bash
bun run e2e -- list
bun run e2e -- run ls-1 --destination ABC
```

OpenADT adapter: `e2e/openadt-adapter.ts`. Config: `e2e.config.yaml` at repo root.

### Scenario Naming Conventions

OpenADT E2E scenarios use specific prefixes to indicate their target system:

- **adtls_** - Scenarios for **adtls-mcp** (SAP ADT Language Server MCP)
  - These scenarios test the SAP ADT Language Server MCP tools
  - Located in `e2e/scenarios/adt-lsp/`
  - Require the adtls-mcp launcher to be running
  - Examples: `ls-1`, `ls-2`, `ls-3` (formerly `adt-1`, `adt-2`, `adt-3`)

- **mcp_** - Scenarios for generic MCP tools (if any)
  - General MCP framework testing scenarios
  - Not specific to SAP ADT

The **adtls_** prefix is used instead of **adt_** to avoid confusion with general ADT operations. These scenarios specifically test the SAP ADT Language Server MCP implementation, not the broader ADT protocol or other ADT-related systems.

### Destination Resolution

When executing E2E scenarios that require a SAP destination, the agent passes `--destination` to `e2e-agent run` (e.g. `/e2e ls-1 ABC` → `bun run e2e -- run ls-1 --destination ABC`). The **OpenADT adapter** resolves partial SIDs (e.g. `ABC` → `ABC_200_USER_EN`) from `~/.adtls/destinations.json`.

**Never commit real system IDs, usernames, or hostnames** — use fictional fixtures only (`ABC`, `DEV`, `ABC_200_USER_EN`). Live destinations are supplied at run time by the operator.

The scenario steps use `{{destination}}` placeholder which gets substituted with the actual destination value from RunContext.

## Project-Specific Testing

Project-specific test suites and scenarios live under `e2e/scenarios/<suite>/`. Each suite has its own entry point and scenario codes.

See project-specific documentation for suite details.

## Related Documentation

- [DESIGN.md](DESIGN.md) - Architecture and spec gate
- [specs/README.md](specs/README.md) - Spec index
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
