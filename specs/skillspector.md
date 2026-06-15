# SkillSpector CI gate

Security scan of agent-skill assets committed to this repository using
[NVIDIA SkillSpector](https://github.com/nvidia/skillspector) — a scanner for
AI agent skills (Claude Code, Codex CLI, Gemini CLI style `SKILL.md`
packages). OpenADT ships a `.agents/skills/` tree that is loaded with
implicit trust by development agents; the gate exists to detect
prompt-injection, data-exfiltration, supply-chain, and dangerous-code patterns
in those skills.

## Scope

| Aspect        | Value                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------- |
| Scan target   | `.agents/skills/` (and any first-party skill at the repo root that follows the `SKILL.md` + assets layout) |
| Tool          | `skillspector` CLI, pinned to a release tag (see [CI action pins](packaging.md#ci-action-pins)) |
| Analysis mode | `--no-llm` (static only; no API keys, deterministic, fast)                                 |
| Output        | SARIF, uploaded to GitHub Code Scanning under category `skillspector`                       |
| Failure mode  | **Advisory** — exit code 1 (findings) does not fail the workflow. Exit code ≥ 2 (tool error) does. Same convention as the OpenGrep job in [ci.yml](../.github/workflows/ci.yml). |
| Triggers      | `push` to `main`, every `pull_request`                                                      |
| Runner        | `ubuntu-latest`                                                                             |

## Rationale

- The `opengrep` job covers general SAST on product code. The skillspector job
  covers the *agent-skill* attack surface specifically (prompt injection,
  exfiltration patterns, AST-level `exec`/`eval`/`subprocess`, MCP tool
  poisoning) which opengrep's generic ruleset does not.
- Research cited upstream: ~26 % of third-party agent skills contain a
  vulnerability; ~5 % show likely malicious intent. Several of OpenADT's
  skills (e.g. `act`, `harvest`, `memory-bank`) are imported from third
  parties, so scanning on every PR catches drift.

## What it does NOT do

- It does not call any LLM provider. No `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`
  / `NVIDIA_INFERENCE_KEY` is wired into CI.
- It does not scan the Java or TypeScript product code. Use the opengrep job
  for that.
- It does not scan `.agents/memory/`, `.agents/backlog/`, or
  `.agents/review-debt/` — those are agent-authored working memory, not
  installable skills. Scanning them produces noise without security signal.

## Promoting to blocking

The first run will almost certainly fire findings on existing skills that
legitimately reference `subprocess`, `os.environ`, dynamic imports, or
network endpoints (e.g. `openadt-local-sap-runtime` documents JCo
invocation; `openadt-product` references subprocess flows). The promotion
from advisory to blocking is a separate, explicit decision:

1. Land the advisory gate (this spec + workflow).
2. Triage the baseline findings — each becomes either a fix or a documented
   suppression, captured in a follow-up spec amendment.
3. Flip the failure policy to `exit 1 = fail` in a second PR, with the
   suppression list checked in alongside it.

## Maintenance

- Bump the pinned SkillSpector release tag when upstream ships a new minor
  version with relevant pattern additions.
- Re-baseline the SARIF category if the tool's rule IDs change in a way that
  suppresses historical findings.
- SkillSpector is Apache-2.0; it is **not** vendored in the repo. The
  workflow downloads the release binary on each run, mirroring how OpenGrep
  is pinned in `ci.yml`.
