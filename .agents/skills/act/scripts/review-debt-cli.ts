#!/usr/bin/env bun
/**
 * Entry point for review-debt scripts (`bun run act:debt:*` / `nx run act-skill:act-debt-*`).
 *
 * Usage:
 *   bun run act:debt:query -- --status open --format tsv
 *   bun run act:debt:plan -- --limit 25
 *   bun run act:debt:harvest -- --merged-since 2026-06-09 --last 5
 *   bun run act:debt:harvest-pr -- 72 --dry-run
 *   bun run act:debt:done -- --status done --fix-pr 99 --thread-id PRRT_…
 *   bun run act:debt:test
 */
import { spawnSync } from "node:child_process";
import { gh } from "./review-debt-gh.ts";

const SCRIPT_DIR = import.meta.dir;

const SUBCOMMANDS = {
  harvest: "harvest-debt-batch.ts",
  "harvest-pr": "harvest-threads.ts",
  query: "query-debt.ts",
  plan: "plan-debt-batch.ts",
  done: "update-debt-status.ts",
} as const;

type Subcommand = keyof typeof SUBCOMMANDS;

function usage(): never {
  console.error(`Usage:
  bun run act:debt:<cmd> -- [args…]

Commands:
  harvest       Batch harvest merged PRs (owner/repo default from gh)
  harvest-pr    Harvest one PR (first arg: PR number)
  query         Query ledger (--status, --area, --duplicates, …)
  plan          Build /act debt batch plan
  done          Update row status (--status, --thread-id, --fix-pr, …)
  test          Run review-debt unit tests

Examples:
  bun run act:debt:query -- --status open --limit 25 --format tsv
  bun run act:debt:harvest -- --pr-ids 72,67 --dry-run
  bun run act:debt:harvest-pr -- 72 --dry-run
  bun run act:debt:done -- --status done --fix-pr 99 --thread-id PRRT_…`);
  process.exit(1);
}

function resolveGhRepo(): { owner: string; repo: string } {
  const slug = process.env.GITHUB_REPOSITORY;
  if (slug) {
    const [owner, repo] = slug.split("/");
    if (owner && repo) {
      return { owner, repo };
    }
  }
  const out = gh([
    "repo",
    "view",
    "--json",
    "owner,name",
    "-q",
    '.owner.login + " " + .name',
  ]).trim();
  const [owner, repo] = out.split(/\s+/);
  if (owner && repo) {
    return { owner, repo };
  }
  throw new Error(
    "Could not resolve GitHub owner/repo. Run from a clone with gh auth, set GITHUB_REPOSITORY, or pass OWNER REPO explicitly.",
  );
}

function runBun(script: string, args: string[]): number {
  const result = spawnSync("bun", [joinScript(script), ...args], {
    stdio: "inherit",
  });
  if (result.error) {
    throw result.error;
  }
  return result.status ?? 1;
}

function joinScript(name: string): string {
  return `${SCRIPT_DIR}/${name}`;
}

function runTests(): number {
  const tests = [
    "review-debt-lib.test.ts",
    "resolve-harvest-prs.test.ts",
    "resolve-harvest-target.test.ts",
    "update-debt-status.test.ts",
  ];
  const paths = tests.map((t) => `${SCRIPT_DIR}/${t}`);
  const result = spawnSync("bun", ["test", ...paths], { stdio: "inherit" });
  if (result.error) {
    throw result.error;
  }
  return result.status ?? 1;
}

function needsRepoPrefix(cmd: Subcommand, argv: string[]): boolean {
  if (cmd !== "harvest" && cmd !== "harvest-pr") {
    return false;
  }
  const first = argv[0];
  if (!first || first.startsWith("--")) {
    return true;
  }
  const second = argv[1];
  if (!second || second.startsWith("--")) {
    return true;
  }
  return false;
}

function prefixOwnerRepo(cmd: Subcommand, argv: string[]): string[] {
  if (!needsRepoPrefix(cmd, argv)) {
    return argv;
  }
  const { owner, repo } = resolveGhRepo();
  if (cmd === "harvest-pr") {
    return [owner, repo, ...argv];
  }
  return [owner, repo, ...argv];
}

function wantsUsage(cmd: string | undefined): boolean {
  if (!cmd) {
    return true;
  }
  return cmd === "--help" || cmd === "-h";
}

function subcommandScript(cmd: string): string {
  const script = SUBCOMMANDS[cmd as Subcommand];
  if (script) {
    return script;
  }
  console.error(`Unknown command: ${cmd}`);
  usage();
}

function runCommand(cmd: string, rest: string[]): number {
  if (cmd === "test") {
    return runTests();
  }
  const script = subcommandScript(cmd);
  const args = prefixOwnerRepo(cmd as Subcommand, rest);
  return runBun(script, args);
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
