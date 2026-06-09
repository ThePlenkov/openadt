# act skill

Portable [Agent Skill](https://agentskills.io/specification) for `/act` on pull requests and `/act debt` for batched review debt.

## Layout

| Path | Purpose |
| ---- | ------- |
| `SKILL.md` | Agent instructions (load on `/act`) |
| `scripts/` | gh/bun helpers (`pr-state.sh`, harvest, query, P5 extract/submit, …) |
| `references/` | `EVALUATE.md` (P6), `RATING_FLOW.md` (P5) |
| `project.json` | Nx targets (`act-skill:act-debt-*`) |

## Move to another repo

Copy this directory (and optionally `.agents/review-debt/` for the ledger). Requirements:

- `gh`, `jq`, `bun`
- Wire `package.json` scripts or call `bun scripts/review-debt-cli.ts` from the skill root
- Set `OPENADT_DEBT_FILE` / `OPENADT_DEBT_SUMMARY` if the ledger path differs

OpenADT wires convenience targets at repo root: `bun run act:debt:*`.
