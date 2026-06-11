# E2E evidence (local only)

Live scenario runs write **one markdown evidence file** per run to **`results/` here**:

`results/<datetime>-✅-<code>-<hash>.md` (or `❌` when the run fails)

**Runner:** `bun run e2e` → generic [e2e-agent](../.agents/skills/e2e/SPEC.md) CLI with OpenADT config `e2e.config.yaml`.

Dispatch JSON for ACP external agents: **`dispatch/`** (gitignored).

See [specs/mcp-ai-testing.md](../specs/mcp-ai-testing.md) and [.agents/skills/e2e/SKILL.md](../.agents/skills/e2e/SKILL.md).

