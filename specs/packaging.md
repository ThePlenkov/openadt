# Packaging

OpenADT ships as **two independent installable products** per release `vX.Y.Z`. SAP binaries are never bundled.

| Product       | Artifact(s)                                                        | Installs via                                             | Runtime                                                                                                                                                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openadt`     | `openadt-X.Y.Z.zip` (Windows + Linux + macOS, single portable zip) | `scoop install openadt` / `brew install openadt`         | JDK 21 + SAP ADT VS Code extension                                                                                                                                                                                                                                                      |
| `openadt-mcp` | `openadt-mcp-X.Y.Z-{platform}.{zip\|tar.gz}` (4 platform archives) | `scoop install openadt-mcp` / `brew install openadt-mcp` | The Bun-compiled binary has no Java dependency; JDK 21 is only needed transitively when `adt-lsc` requires it. Scoop: no JDK install at `scoop install` time. Homebrew: `depends_on "openjdk@21"` is a runtime suggestion for `adt-lsc` and is installed by `brew install openadt-mcp`. |

The two products share the `~/.openadt/` config and the `~/.openadt/mcp/endpoints/` store. They are installed, upgraded, and uninstalled independently. The Java `openadt mcp` subcommand wraps `openadt-mcp` (see [cli.md](cli.md#openadt-mcp), [mcp.md](mcp.md#product-openadt-mcp)).

## `openadt` ZIP

`openadt-X.Y.Z.zip` contents:

- `openadt.jar` — distribution jar
- `openadt.exe` — Windows launcher
- `bin/` — PowerShell + bash launchers
- `LICENSE`, `VERSION`

**Not** in the zip: `sap-adt-mcp-launcher/`. The `openadt mcp` Java subcommand resolves and spawns `openadt-mcp` on PATH at runtime (see [cli.md](cli.md#openadt-mcp)).

## `openadt-mcp` archives

`openadt-mcp-X.Y.Z-{platform}.{zip|tar.gz}` per release, one archive per matrix entry:

| Platform       | Archive                                 |
| -------------- | --------------------------------------- |
| `win-x64`      | `openadt-mcp-X.Y.Z-win-x64.zip`         |
| `linux-x64`    | `openadt-mcp-X.Y.Z-linux-x64.tar.gz`    |
| `darwin-arm64` | `openadt-mcp-X.Y.Z-darwin-arm64.tar.gz` |
| `darwin-x64`   | `openadt-mcp-X.Y.Z-darwin-x64.tar.gz`   |

Each archive contains the compiled Bun binary (`openadt-mcp.exe` on Windows, `openadt-mcp` elsewhere), `LICENSE`, `README.md`, `VERSION`. Bun is **not** required at install or runtime — the binary embeds the runtime.

## Windows

- **Scoop** (recommended): `scoop bucket add openadt https://github.com/abapify/scoop-bucket` then `scoop install openadt` (updated every Release via [`abapify/scoop-bucket`](https://github.com/abapify/scoop-bucket); CI uses org app **abapify-bro** — [packaging/abapify-bro-app.md](../packaging/abapify-bro-app.md)). Legacy monorepo branch: `git clone -b scoop-bucket --depth 1 https://github.com/abapify/openadt openadt-bucket` then `scoop bucket add openadt .\openadt-bucket\packaging\scoop`
- One-shot install: `scoop install https://raw.githubusercontent.com/abapify/openadt/main/packaging/scoop/openadt.json`
- **Standalone MCP install:** `scoop install openadt-mcp` (separate Scoop manifest `packaging/scoop/openadt-mcp.json`; post-install: `packaging/scoop/openadt-mcp-post-install.ps1`).
- Maintainer: `bun run package:release -- --version=<semver>`

### `openadt` Scoop manifest cleanup

The `openadt` manifest no longer carries MCP-specific entries:

- Drop `Bun (for openadt mcp)` from `suggest` (`java/openjdk21` remains for `fetch`/`proxy`).
- Remove MCP from `notes` (the "Next steps" footer may mention `scoop install openadt-mcp` as an alternative for users who want only the launcher).
- Remove the MCP post-install launcher check from `packaging/scoop/post-install.ps1` (the `bun` check and the `sap-adt-mcp-launcher\src\main.ts` existence test go away).

### `openadt-mcp` Scoop manifest

`packaging/scoop/openadt-mcp.json`:

- `bin`: `openadt-mcp.exe`
- `extract_dir`: `openadt-mcp-X.Y.Z`
- `suggest`: `JDK 21` (for `adt-lsc` only)
- No `Bun` suggest, no `Java/openjdk21` runtime dependency

`packaging/scoop/openadt-mcp-post-install.ps1`:

- Check SAP ADT VS Code extension presence (the `adt-lsc` binary).
- Check JDK 21 (for `adt-lsc`; no Bun check).
- Print next steps: install `sapse.adt-vscode` if missing, configure `.cursor/mcp.json` with `"command": "openadt-mcp"`.

## Linux / macOS

- Tap (once): `brew tap abapify/openadt` → [`abapify/homebrew-openadt`](https://github.com/abapify/homebrew-openadt)
- Install: `brew install openadt`
- Upgrade: `brew update && brew upgrade openadt`
- Formula source in main repo: `Formula/openadt.rb` (synced from `packaging/homebrew/openadt.rb` on each release)
- Tap mirror: `tools/sync-homebrew-tap/sync.sh` + org app **abapify-bro** ([packaging/abapify-bro-app.md](../packaging/abapify-bro-app.md)); workflow template `packaging/homebrew/homebrew-tap-mirror.yml`
- Maintainer copy: `packaging/homebrew/openadt.rb`
- HEAD install from a git checkout: `brew install --HEAD --formula packaging/homebrew/openadt.rb`
- Legacy monorepo tap: `brew tap abapify/openadt https://github.com/abapify/openadt.git` (same `Formula/` on `main`)
- `package:release` updates formula `STABLE` and `sha256`
- Stable formulae must pin version + URL + checksum (Homebrew requirement for verified, reproducible installs). Values are release-automated; `abapify/homebrew-openadt` is a mirror of `Formula/openadt.rb`, not a second source of truth.

### `openadt` Homebrew formula cleanup

- Drop the `libexec.install mcp_launcher` block from `packaging/homebrew/openadt.rb` (and its mirror `Formula/openadt.rb`).

### `openadt-mcp` Homebrew formula

`packaging/homebrew/openadt-mcp.rb` (mirror `Formula/openadt-mcp.rb`):

- `depends_on "openjdk@21"` (for `adt-lsc`; no `depends_on "bun"`)
- `on_macos` / `on_linux` blocks select the right archive URL by platform
- `bin.install "openadt-mcp"`
- Stable formulae must pin version + URL + checksum per platform (Homebrew requirement); values are release-automated

## CI action pins

Workflows use current stable major tags: `actions/checkout@v6`, `actions/setup-java@v5`, `actions/setup-dotnet@v5`, `oven-sh/setup-bun@v2`, `nrwl/nx-set-shas@v5`, `softprops/action-gh-release@v3`, `github/codeql-action/upload-sarif@v4`. Bump when upstream releases a new major.

## Dependency audit

`ci.yml` job `dep-audit` runs `bun audit` against the transitive dep
tree and uploads the JSON result as SARIF to GitHub Code Scanning under
category `dep-audit`. **Advisory** — does not fail the workflow; the
high/critical findings are emitted as `::warning` annotations and the
severity counts as a `::notice` so they show up in the run summary.

| Aspect        | Value |
| ------------- | ----- |
| Tool          | `bun audit` (Bun-bundled, no install) |
| Lockfile      | `bun.lock` (pinned via `--frozen-lockfile`) |
| Threshold     | All severities reported. High+ as `::warning` annotations. No fail-fast today. |
| Failure mode  | None today. The future blocking promotion (see below) will fail on critical/high. |
| Scope         | All workspaces in the root `bun install` graph (the e2e skill, the TS packages, the dev tools) |
| SARIF cat     | `dep-audit` |

### Promoting to blocking

Mirrors the SkillSpector pattern ([skillspector.md](skillspector.md)):

1. Land the advisory gate (this spec + workflow).
2. Triage the baseline advisories into "fix in this PR" or "waitlist" rows
   in the table below.
3. Flip the failure policy to `exit 1 = fail` on critical/high in a
   second PR, with the waitlist acknowledged.

Suppressions are **not** in scope: a `bun audit --ignore=...` is acceptable
for a documented upstream-blocked CVE (e.g. awaiting `nx` to bump
`form-data`), but the suppression list lives in the spec, not in CI knobs
(see the waitlist below).

### Workflow gap: `nx affected` skips skill scripts

`ci.yml` runs `bunx nx affected -t lint typecheck` against the diff. Nx
projects are registered in `apps/*/project.json`, `packages/*/project.json`,
and the two skills that opted in (`.agents/skills/act/project.json`,
`.agents/skills/harvest/project.json`). All other skill scripts
(`.agents/skills/e2e/scripts/`, `.agents/skills/memory-bank/`,
`.agents/skills/codescene/`, etc.) and `scripts/verify-*.ts` are
**not** Nx projects, so changes to them yield `NX No tasks were run`
on the CI side.

Local mitigation: run the strict ESLint tier directly — it covers
`scripts/` and `.agents/skills/` even when Nx doesn't:

```bash
bunx eslint scripts/ .agents/skills/ --max-warnings 0 --no-error-on-unmatched-pattern
```

Track closing this gap as a follow-up: either add `project.json` to
each skill or add a top-level `lint:skills` Nx target that globs the
union of all `scripts/` paths.

### Review findings (waitlist)

Vulnerabilities that survive `bun update --latest` because upstream has not
released a fix yet. Each row is one transitive advisory. The PR that
clears a row must either pin a parent to a fixed range, remove the parent
entirely, or document a separately-accepted risk (e.g. "dev tool only,
does not ship to consumers").

| Advisory | Parent | Severity | Status | Note |
| -------- | ------ | -------- | ------ | ---- |
| `form-data` CRLF injection | `nx` → `axios` | high | Waiting on `nx` | `axios` bumped `form-data` to 4.0.6 in `axios@1.x`; `nx@22.7.x` still pulls the vulnerable range. |
| `shell-quote` unescaped newlines | `@modelcontextprotocol/inspector` | critical | Waiting on inspector | Dev tool only — does not ship to consumers. Inspector is an MCP inspector used interactively; not in any server / CLI path. |
| `tmp` path traversal | `nx` | high | Waiting on `nx` | Two advisories; both fixed upstream in `tmp@0.2.7`. |
| `brace-expansion` DoS | multiple parents' `minimatch` | moderate | Non-gating | Reported in audit log; not in the high/critical threshold. |
| `yaml` stack overflow | `nx` | moderate | Non-gating | Reported in audit log; not in the high/critical threshold. |

## SkillSpector pin

`skillspector` is not vendored; the workflow downloads the upstream release tarball. Pin a specific upstream release tag (e.g. `vX.Y.Z`) and bump on new minor versions that add relevant detection patterns. Full contract: [skillspector.md](skillspector.md).

## Release workflow

One workflow (`release.yml`) handles the full release pipeline as four sequential jobs.

### `release.yml` — bump → build → publish → sync (manual trigger)

Manual **Release** workflow (Actions → Release → Run workflow):

1. Choose **version bump**: `patch`, `minor`, `major`, `prerelease`, `prepatch`, `preminor`, `premajor`
2. Optionally set **prerelease id** (`rc`, `beta`, `alpha`) — required only for `prerelease`, `prepatch`, `preminor`, and `premajor` (omit for `patch` / `minor` / `major`)
3. Optionally check **Draft** — creates a draft release with assets attached; `sync` job is skipped until manually published

Four jobs run in sequence:

| Job          | Runner(s)                                                                                                                                               | Does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`bump`**   | ubuntu                                                                                                                                                  | Reads latest `v*` tag (or `pom.xml` baseline), bumps `pom.xml` + both Scoop manifests + both Homebrew formula stubs, commits, pushes, creates tag                                                                                                                                                                                                                                                                                                                                   |
| **`build`**  | **Matrix of 4 runners** — `windows-latest` (`win-x64`), `ubuntu-latest` (`linux-x64`), `macos-latest` (`darwin-arm64`), `macos-15-intel` (`darwin-x64`) | Each matrix entry runs `bun run mcp:build:compile -- --platform=<matrix.platform> --out=…` and produces `openadt-mcp-X.Y.Z-<platform>.{zip\|tar.gz}`. The `windows-latest` entry **additionally** builds the `openadt.jar` (`-Pdistribution`) and runs `package:release` to produce `openadt-X.Y.Z.zip` + `openadt-X.Y.Z.zip.sha256`. `darwin-x64` uses `macos-15-intel` (the last x86_64 GitHub-hosted runner image; `macos-13` was deprecated and routinely queues indefinitely). |
| **`create`** | ubuntu                                                                                                                                                  | Downloads all artifacts (one `openadt.zip` from the `windows-latest` runner, four `openadt-mcp-<platform>` archives), creates GitHub Release titled `Release vX.Y.Z` with all assets attached at creation time (required for immutable releases)                                                                                                                                                                                                                                    |
| **`sync`**   | ubuntu                                                                                                                                                  | Downloads `.zip.sha256` and each `openadt-mcp-<platform>.{zip\|tar.gz}.sha256`, patches `openadt.json` + `openadt-mcp.json` (Scoop) and `Formula/openadt.rb` + `Formula/openadt-mcp.rb` (Homebrew), syncs `abapify/scoop-bucket` and `abapify/homebrew-openadt`, dispatches mirror events — skipped for draft releases                                                                                                                                                              |

Notes:

- Assets are attached at `gh release create` time — no post-creation upload, compatible with immutable releases.
- `GITHUB_TOKEN` is sufficient; no GitHub App token needed (no cross-workflow event chaining).
- Draft releases skip `sync`; publish the draft from the GitHub UI when ready — then re-run `sync` manually if needed, or just retrigger the workflow.

Local dry-run (no git writes):

```bash
bun run release:version -- --bump=patch
```
