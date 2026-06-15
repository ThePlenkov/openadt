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
| Tool          | `skillspector` CLI, pinned to a release tag (see [SkillSpector pin](packaging.md#skillspector-pin)) |
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

## Baseline findings (advisory, 2026-06-15)

First-run SARIF from commit `7f53600`. Triage outcomes (action or
suppress-with-rationale). The SARIF category stays `skillspector`; this
table is the **audit log** for any future move to blocking.

| # | Rule | Severity | File:line | Triage | Rationale |
|---|------|----------|-----------|--------|-----------|
| 8  | SC1 | note     | `.agents/skills/e2e/package.json:27`  | **Fixed** | Replaced `^4.1.0` with exact `4.2.0` (CVE-2025-64718, CVE-2026-53550 both patched). |
| 9  | SC1 | note     | `.agents/skills/e2e/package.json:30`  | **Fixed** | `@types/js-yaml` caret → exact `4.0.9`. |
| 10 | SC1 | note     | `.agents/skills/e2e/package.json:31`  | **Fixed** | `@types/node` caret → exact `22.15.21` (avoid floating into v25). |
| 11 | SC1 | note     | `.agents/skills/e2e/package.json:32`  | **Fixed** | `typescript` caret → exact `6.0.3`. |
| 12 | SC4 | note     | `.agents/skills/e2e/package.json:27`  | **Fixed** | `js-yaml` 4.1.0 → 4.2.0 (covers both CVEs). |
| 13 | TM3 | warning  | `.agents/skills/harvest/SKILL.md:22`  | **Suppress** | False positive. Documents the `ignore_authors` / `nit_authors` config keys — feature is the *purpose* of the harvest config. |
| 14 | TM3 | warning  | `.agents/skills/harvest/SKILL.md:113` | **Suppress** | False positive. JSON example illustrating the on-disk config shape. |
| 15 | TM3 | warning  | `review-debt-lib.ts:72`                | **Suppress** | False positive. `DebtConfig.ignore_authors: string[]` is the typed deny-list field — required for the feature. |
| 16 | TM3 | warning  | `review-debt-lib.ts:104`               | **Suppress** | False positive. Empty-array fallback when `config.json` is missing. Hardening this to refuse-to-run would break `/harvest` on first use. |
| 17 | TM3 | warning  | `review-debt-lib.ts:111`               | **Suppress** | False positive. `parsed.ignore_authors ?? []` is the missing-field default — same as #16. |
| 18 | TM3 | warning  | `review-debt-lib.ts:111`               | **Suppress** | Same line as #17, second instance of the same deny-list field. |
| 19 | TM3 | warning  | `review-debt-lib.ts:337`               | **Suppress** | False positive. The `ignore_authors.some(a => a.toLowerCase() === login)` predicate is the **allow-or-deny** check itself. Removing it inverts the feature. |
| 7  | RA2 | warning  | `.agents/skills/memory-bank/SKILL.md:39` | **Suppress** | False positive. `.agents/memory/<type>/YYYY-MM-DD-<slug>.md` is the spec'd storage path for `memory-bank` — see [DESIGN.md §Documentation map](../DESIGN.md) and the skill's own `SPEC`. |
| 6  | PE3 | error    | `.agents/skills/codescene/SKILL.md:17`  | **Suppress** | False positive. The skill *mentions* the name `CS_ACCESS_TOKEN` to document rotation/troubleshooting; the actual secret lives in the `abapify` org's GitHub Actions secrets and is never written to disk by OpenADT. Any future PE3 finding on a file that **reads** a token value would be triaged separately. |

### Why not rename `ignore_authors` to silence TM3?

The `ignore_authors` field is consumed by callers and by `config.json` on
disk. Renaming it would be a breaking change to the harvest contract (the
field is part of the public `/harvest` config schema, documented in
`harvest/SKILL.md`). The static-analysis rule is firing on a feature
that exists by design, not on a defect.

### How to verify suppression holds

When the gate is promoted to blocking, suppressions are enforced by:

1. Re-running the scan on this commit (`7f53600` + the fixes in this PR) and
   confirming that all `warning`-and-above findings match a row in the
   baseline table above.
2. Any new `error` or `warning` finding introduced after `2026-06-15` must
   either be fixed in the same PR that introduces the finding, or added to
   this table with a rationale — never silently bypassed.

## Maintenance

- Bump the pinned SkillSpector release tag when upstream ships a new minor
  version with relevant pattern additions.
- Re-baseline the SARIF category if the tool's rule IDs change in a way that
  suppresses historical findings.
- SkillSpector is Apache-2.0; it is **not** vendored in the repo. The
  workflow downloads the release binary on each run, mirroring how OpenGrep
  is pinned in `ci.yml`.
