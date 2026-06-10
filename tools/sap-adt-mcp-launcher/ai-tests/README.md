# MCP AI scenario tests

Live acceptance tests for OpenADT `adt_*` tools. **One Markdown file per scenario** — readable by humans and AI agents. No SID in git.

Spec: [specs/mcp-ai-testing.md](../../../specs/mcp-ai-testing.md)

## Layout

```
ai-tests/
  scenarios/
    mcp-1-list-destinations.md   # agent brief (markdown) + YAML frontmatter (steps)
    mcp-2-read-standard-class.md
    ...
  framework/                 # runner
  run.ts
  agent-playbook.md          # index for agents
```

Each `scenarios/mcp-N-<id>.md`:

- **YAML frontmatter** (`---` … `---`): `code` (`mcp-1`…), `id`, `title`, `mode`, `steps` for the runner
- **Markdown body**: full scenario brief for Cursor / Devin (intent, steps, success criteria)

## Quick start

```bash
bun run e2e -- mcp-1 --destination ABC_200_USER_EN   # evidence → .e2e/results/
bun run mcp:ai-tests -- --destination ABC_200_USER_EN
bun run mcp:ai-tests -- --list
bun run mcp:ai-tests -- --destination ABC_200_USER_EN --scenario mcp-2
bun run mcp:ai-tests -- --destination ABC_200_USER_EN --scenario read-standard-class
```

Agent skill: `/e2e mcp-N` — [.agents/skills/e2e/SKILL.md](../../../.agents/skills/e2e/SKILL.md)

## For AI agents

1. Open `scenarios/mcp-N-<id>.md` — the markdown body is the scenario script.
2. Ask the user for **destination id** (`SID_CLIENT_USER_LANG`).
3. Run tools manually **or** `bun run mcp:ai-tests` with `--destination`.

See [agent-playbook.md](./agent-playbook.md).

## New scenario

Add `scenarios/mcp-N-<id>.md` — copy an existing file, assign the next free `code`, and name the file `mcp-N-<id>.md` matching frontmatter `id`. Use `{{destination}}` in frontmatter only, never a real SID.

## Unit tests (no SAP)

```bash
bun test tools/sap-adt-mcp-launcher/ai-tests/framework
```
