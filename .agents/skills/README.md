# Agent skills

| Skill | Trigger |
| --- | --- |
| [act](act/SKILL.md) | `/act <context>` where context ∈ {`pr`, `plan`, `backlog`, `harvest`}; resolves threads in product code (or posts a reply), then closes threads |
| [harvest](harvest/SKILL.md) | `/harvest` — collect unresolved PR review threads into `.agents/review-debt/harvests/*.jsonl` on merge (one-way, no fixes) |
| [backlog](backlog/SKILL.md) | Actionable improvement items (`.agents/backlog/`); also triages harvest rows and archives fully-processed files |
| [codescene](codescene/SKILL.md) | CodeScene CI, local CLI, CS_ACCESS_TOKEN, Docker, troubleshooting |
| [memory-bank](memory-bank/SKILL.md) | `/remember` — unified agent memory (`.agents/memory/`) |
| [retrospect](retrospect/SKILL.md) | `/retrospect` — reflect, record experience, create backlog items |
| [openadt-product](openadt-product/SKILL.md) | fetch, proxy, MCP, transport |
| [openadt-sdd](openadt-sdd/SKILL.md) | spec → test → code |
| [openadt-sap-sdk-apis](openadt-sap-sdk-apis/SKILL.md) | SDK APIs |
| [openadt-local-sap-runtime](openadt-local-sap-runtime/SKILL.md) | JCo, SNC, HTTP SSO, failures |
| [openadt-devcontainer-host-runtime](openadt-devcontainer-host-runtime/SKILL.md) | WSL / devcontainer vs host |

[DESIGN.md](../../DESIGN.md) · [AGENTS.md](../../AGENTS.md) · [REVIEW.md](../../REVIEW.md). Update the matching skill in the same PR as code/spec changes.
