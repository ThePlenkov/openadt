# E2E evidence (local only)

Live MCP scenario runs write **one markdown evidence file** per run to **`results/` here at the repo root**:

`results/<datetime>-✅-mcp-N-<hash>.md` (or `❌` when the run fails)

Each file follows **Given / When / Then** and records assertion checks (expected vs actual) plus a response payload excerpt.

`scripts/e2e.ts` pins `--evidence-dir` to `<repo>/.e2e/results`.

External executor dispatch (e.g. `--acp --agent <id>`) writes handoff JSON to **`dispatch/`** here (also gitignored).

This directory is gitignored except this README. See [specs/mcp-ai-testing.md](../specs/mcp-ai-testing.md) and [.agents/skills/e2e/SKILL.md](../.agents/skills/e2e/SKILL.md).
