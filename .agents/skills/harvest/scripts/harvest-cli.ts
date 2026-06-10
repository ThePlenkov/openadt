#!/usr/bin/env bun
/**
 * Entry point for /harvest scripts (`bun run harvest:*`).
 *
 * /harvest collects review threads ("the harvest"). What happens with the
 * harvest downstream — `/backlog` triage, `/act` batch fix, source-PR resolve —
 * is owned by other skills. /harvest only writes
 * `.agents/review-debt/harvests/*.jsonl` and `.agents/review-debt/debt-summary.json`.
 *
 * Commands:
 *   bun run harvest:pr      -- 72 [--dry-run]                       single PR
 *   bun run harvest:batch   -- --pr-ids 72,67 [--dry-run]           filtered batch
 *   bun run harvest:resolve                                                  write
 *                                                                            should_harvest
 *                                                                            outputs
 *                                                                            from a GH
 *                                                                            event
 *   bun run harvest:test                                                  run
 *                                                                            /harvest
 *                                                                            unit tests
 */
import { spawnSync } from "node:child_process";

const SCRIPT_DIR = import.meta.dir;

const SUBCOMMANDS = {
  pr: "harvest-threads.ts",
  batch: "harvest-debt-batch.ts",
  resolve: "resolve-harvest-target.ts",
  archive: "archive-harvest.ts",
} as const;

type Subcommand = keyof typeof SUBCOMMANDS;

const GH_REPO_FIELDS = "owner.login,nameWithOwner";

interface GhRepo {
  owner: string;
  repo: string;
}

function parseOwnerLogin(parsed: {
  [k: string]: unknown;
  owner?: { login?: string };
}): string | null {
  return typeof parsed.owner?.login === "string" ? parsed.owner.login : null;
}

function parseNameWithOwner(parsed: {
  [k: string]: unknown;
  nameWithOwner?: string;
}): string | null {
  return typeof parsed.nameWithOwner === "string" ? parsed.nameWithOwner : null;
}

function splitOwnerRepo(nameWithOwner: string): GhRepo | null {
  const slash = nameWithOwner.indexOf("/");
  if (slash < 0) {
    return null;
  }
  const owner = nameWithOwner.slice(0, slash);
  const repo = nameWithOwner.slice(slash + 1);
  if (!owner || !repo) {
    return null;
  }
  return { owner, repo };
}

function parseGhRepoView(stdout: string): GhRepo | null {
  let parsed:
    | {
        [k: string]: unknown;
        owner?: { login?: string };
        nameWithOwner?: string;
      }
    | null = null;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return null;
  }
  if (!parsed) {
    return null;
  }
  const owner = parseOwnerLogin(parsed);
  const nameWithOwner = parseNameWithOwner(parsed);
  if (owner && nameWithOwner) {
    return { owner, repo: nameWithOwner };
  }
  if (nameWithOwner) {
    return splitOwnerRepo(nameWithOwner);
  }
  return null;
}

function resolveGhRepo(): GhRepo | null {
  const envRepo = process.env.GITHUB_REPOSITORY;
  if (envRepo && envRepo.includes("/")) {
    const [owner, repo] = envRepo.split("/", 2);
    if (owner && repo) {
      return { owner, repo };
    }
  }
  const result = spawnSync(
    "gh",
    ["repo", "view", "--json", GH_REPO_FIELDS],
    { encoding: "utf8" },
  );
  if (result.status !== 0 || !result.stdout) {
    return null;
  }
  return parseGhRepoView(result.stdout);
}

function withOwnerRepo(cmd: Subcommand, rest: string[]): string[] {
  if (cmd !== "pr" && cmd !== "batch") {
    return rest;
  }
  if (rest[0] && !rest[0].startsWith("--")) {
    return rest;
  }
  const repo = resolveGhRepo();
  if (!repo) {
    return rest;
  }
  return [repo.owner, repo.repo, ...rest];
}

function usage(): never {
  console.error(`Usage:
  bun run harvest:<cmd> -- [args…]

Commands:
  pr        Harvest one merged PR (positional: PR_NUMBER, --merged-sha, --run-id)
  batch     Batch harvest merged PRs (--pr-ids, --merged-since, --last, …)
  resolve   Resolve PR + merge SHA from a GH Actions event (writes outputs)
  archive   Move fully-triaged harvests/*.jsonl into archive/ (used by /backlog harvest)
  test      Run /harvest unit tests

Examples:
  bun run harvest:pr -- 72 --dry-run
  bun run harvest:batch -- --pr-ids 72,67 --dry-run
  bun run harvest:batch -- --merged-since 2026-06-09 --last 5
  bun run harvest:archive -- --dry-run`);
  process.exit(1);
}

function runBun(script: string, args: string[]): number {
  const result = spawnSync("bun", [`${SCRIPT_DIR}/${script}`, ...args], {
    stdio: "inherit",
  });
  if (result.error) {
    throw result.error;
  }
  return result.status ?? 1;
}

function runTests(): number {
  const tests = [
    "review-debt-lib.test.ts",
    "resolve-harvest-prs.test.ts",
    "resolve-harvest-target.test.ts",
    "archive-harvest.test.ts",
  ];
  const paths = tests.map((t) => `${SCRIPT_DIR}/${t}`);
  const result = spawnSync("bun", ["test", ...paths], { stdio: "inherit" });
  if (result.error) {
    throw result.error;
  }
  return result.status ?? 1;
}

function wantsUsage(cmd: string | undefined): boolean {
  if (!cmd) {
    return true;
  }
  return cmd === "--help" || cmd === "-h";
}

function subcommandScript(cmd: string): string {
  const script = SUBCOMMANDS[cmd as Subcommand];
  if (!script) {
    console.error(`Unknown command: ${cmd}`);
    usage();
  }
  return script;
}

function runCommand(cmd: string, rest: string[]): number {
  if (cmd === "test") {
    return runTests();
  }
  const subcommand = cmd as Subcommand;
  return runBun(subcommandScript(subcommand), withOwnerRepo(subcommand, rest));
}

function main(): void {
  const [cmd, ...rest] = process.argv.slice(2);
  if (wantsUsage(cmd)) {
    usage();
  }
  process.exit(runCommand(cmd!, rest));
}

if (import.meta.main) {
  main();
}
