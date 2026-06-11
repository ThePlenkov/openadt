# E2E AI Testing Skill

Abstract AI-first testing framework for scenarios. Can be used as a standalone CLI via npx/bunx or as a library for custom integrations.

## Installation

```bash
# Via npx
npx e2e-ai-testing-skill <command>

# Via bunx
bunx e2e-ai-testing-skill <command>
```

## Documentation

For complete framework documentation, see [TESTING.md](../../../TESTING.md).

## Structure

### Entrypoints

**Public CLI:**
- `cli.ts` - Main CLI entry point (compiled to `cli.js`)
  - Commands: `list`, `run`, `dispatch`, `help`
  - Used by AI agents via terminal or script execution

**Skill Spec:**
- `SKILL.md` - Skill specification for AI agents
  - Describes the skill contract
  - Provides usage examples

### Internal Framework Scripts (`scripts/framework/`)

These are internal utilities - not entrypoints, but can be imported for custom integrations:

- `types.ts` - TypeScript types
- `context.ts` - CLI parsing, context building
- `scenarios.ts` - Scenario loading/parsing
- `template.ts` - Template substitution
- `assertions.ts` - Assertion evaluation
- `evidence.ts` - Evidence report generation
- `dispatch.ts` - ACP dispatch payload generation
- `ai-extract.ts` - AI parameter extraction

## Quick Start

```bash
# List scenarios
npx e2e-ai-testing-skill list ./e2e/scenarios

# Run a scenario
npx e2e-ai-testing-skill run ./e2e/scenarios test-1

# Get help
npx e2e-ai-testing-skill help
```

## Programmatic Usage

Import framework modules for custom integrations:

```typescript
import { loadScenariosFromDir } from './scripts/framework/scenarios.js'
import { buildRunContext } from './scripts/framework/context.js'

const scenarios = loadScenariosFromDir('./e2e/scenarios')
const ctx = buildRunContext(opts, destination)
```
