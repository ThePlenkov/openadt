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

Invoke the skill via the `/e2e` command or import the framework modules for custom integrations. See the [skill specification](.agents/skills/e2e/SKILL.md) for complete usage details.

### Scenario Naming Conventions

OpenADT E2E scenarios use specific prefixes to indicate their target system:

- **adtls_** - Scenarios for **adtls-mcp** (SAP ADT Language Server MCP)
  - These scenarios test the SAP ADT Language Server MCP tools
  - Located in `e2e/scenarios/adt-lsp/`
  - Require the adtls-mcp launcher to be running
  - Examples: `adtls-1`, `adtls-2`, `adtls-3` (formerly `adt-1`, `adt-2`, `adt-3`)

- **mcp_** - Scenarios for generic MCP tools (if any)
  - General MCP framework testing scenarios
  - Not specific to SAP ADT

The **adtls_** prefix is used instead of **adt_** to avoid confusion with general ADT operations. These scenarios specifically test the SAP ADT Language Server MCP implementation, not the broader ADT protocol or other ADT-related systems.

### Destination Resolution

When executing E2E scenarios that require a SAP destination, the AI agent must:

1. **Extract destination from user prompt** - The destination ID is typically provided in the prompt (e.g., `/e2e adtls-1 BHF` where BHF is the destination)
2. **Validate destination exists** - Check if the destination is registered in the ADT configuration
3. **Pass destination to scenario** - Include the destination in the RunContext as `destination` parameter

Common destinations:
- **BHF** - Sandbox environment (most isolated)
- **S0D** - Development environment

The scenario steps use `{{destination}}` placeholder which gets substituted with the actual destination value from RunContext.

## Project-Specific Testing

Project-specific test suites and scenarios live under `e2e/scenarios/<suite>/`. Each suite has its own entry point and scenario codes.

See project-specific documentation for suite details.

## Related Documentation

- [DESIGN.md](DESIGN.md) - Architecture and spec gate
- [specs/README.md](specs/README.md) - Spec index
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
