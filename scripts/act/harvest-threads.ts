#!/usr/bin/env bun
/**
 * Harvest unresolved PR review threads into .agents/review-debt/debt.jsonl.
 *
 * Triggered by review-debt-harvest.yml on merge (or workflow_dispatch).
 * Not part of /act — run only on merge or manual backfill.
 *
 * Usage:
 *   bun scripts/act/harvest-threads.ts OWNER REPO PR_NUMBER \
 *     --merged-sha SHA --run-id RUN_ID
 *   bun scripts/act/harvest-threads.ts abapify openadt 81 --dry-run
 */
import {
  bodyPreview,
  buildSummary,
  classifyThread,
  deriveArea,
  ensureGhAuth,
  fetchReviewThreads,
  fingerprint,
  gh,
  loadConfig,
  readDebtRecords,
  upsertRecords,
  writeDebtRecords,
  writeSummary,
  type DebtRecord,
} from "./review-debt-lib.ts";

interface HarvestArgs {
  owner: string;
  repo: string;
  pr: number;
  mergedSha: string;
  runId: string;
  dryRun: boolean;
}

function readFlag(argv: string[], index: number): [string | null, number] {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    return [null, index];
  }
  return [value, index + 1];
}

function parseArgs(argv: string[]): HarvestArgs {
  const positional: string[] = [];
  let mergedSha = "";
  let runId = "local";
  let dryRun = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--merged-sha") {
      const [value, next] = readFlag(argv, i);
      mergedSha = value ?? "";
      i = next;
      continue;
    }
    if (arg === "--run-id") {
      const [value, next] = readFlag(argv, i);
      if (value) {
        runId = value;
      }
      i = next;
      continue;
    }
    positional.push(arg);
  }

  return finalizeHarvestArgs({ positional, mergedSha, runId, dryRun });
}

function finalizeHarvestArgs(opts: {
  positional: string[];
  mergedSha: string;
  runId: string;
  dryRun: boolean;
}): HarvestArgs {
  const [owner, repo, prRaw] = opts.positional;
  const pr = Number(prRaw);
  if (!owner || !repo || !Number.isFinite(pr)) {
    console.error(
      "Usage: harvest-threads.ts OWNER REPO PR_NUMBER [--merged-sha SHA] [--run-id ID] [--dry-run]",
    );
    process.exit(2);
  }
  return {
    owner,
    repo,
    pr,
    mergedSha: opts.mergedSha,
    runId: opts.runId,
    dryRun: opts.dryRun,
  };
}

function fetchPrMeta(opts: HarvestArgs): {
  title: string;
  url: string;
  mergedAt: string;
  mergeSha: string;
} {
  const viewed = JSON.parse(
    gh([
      "pr",
      "view",
      String(opts.pr),
      "--repo",
      `${opts.owner}/${opts.repo}`,
      "--json",
      "title,url,mergedAt,mergeCommit,state",
    ]),
  ) as {
    title: string;
    url: string;
    mergedAt: string | null;
    mergeCommit?: { oid: string };
    state: string;
  };

  if (viewed.state !== "MERGED") {
    console.error(
      `error: PR #${opts.pr} is not merged (state=${viewed.state})`,
    );
    process.exit(1);
  }

  const mergeSha = opts.mergedSha || viewed.mergeCommit?.oid || "";
  return {
    title: viewed.title,
    url: viewed.url,
    mergedAt: viewed.mergedAt ?? new Date().toISOString(),
    mergeSha,
  };
}

function threadUrl(prUrl: string, threadId: string): string {
  return `${prUrl}#${threadId}`;
}

function toDebtRecord(opts: {
  thread: Awaited<ReturnType<typeof fetchReviewThreads>>[number];
  meta: ReturnType<typeof fetchPrMeta>;
  pr: number;
  runId: string;
  harvestedAt: string;
  classification: ReturnType<typeof classifyThread>;
}): DebtRecord {
  const comment = opts.thread.comments.nodes[0] ?? {};
  const author = comment.author?.login ?? "unknown";
  const path = comment.path ?? "";
  const body = comment.body ?? "";

  return {
    thread_id: opts.thread.id,
    thread_url: threadUrl(opts.meta.url, opts.thread.id),
    status: "open",
    priority: opts.classification.priority,
    needs: opts.classification.needs,
    source_pr: opts.pr,
    source_pr_url: opts.meta.url,
    source_pr_title: opts.meta.title,
    merged_at: opts.meta.mergedAt,
    merged_sha: opts.meta.mergeSha,
    path,
    line: comment.line ?? null,
    author,
    body,
    body_preview: bodyPreview(body),
    fingerprint: fingerprint(body, path),
    area: deriveArea(path),
    harvested_at: opts.harvestedAt,
    harvest_run_id: opts.runId,
    times_seen: 1,
    fix_pr: null,
    fixed_at: null,
    notes: null,
  };
}

function collectHarvestRows(opts: {
  threads: Awaited<ReturnType<typeof fetchReviewThreads>>;
  config: ReturnType<typeof loadConfig>;
  meta: ReturnType<typeof fetchPrMeta>;
  pr: number;
  runId: string;
  harvestedAt: string;
}): { incoming: DebtRecord[]; skipped: number; skippedOutdated: number } {
  const incoming: DebtRecord[] = [];
  let skipped = 0;
  let skippedOutdated = 0;

  for (const thread of opts.threads) {
    if (thread.isResolved) {
      continue;
    }
    if (thread.isOutdated) {
      skippedOutdated += 1;
      continue;
    }
    const author = thread.comments.nodes[0]?.author?.login ?? "unknown";
    const classification = classifyThread({ author, config: opts.config });
    if (!classification.harvest) {
      skipped += 1;
      continue;
    }
    incoming.push(
      toDebtRecord({
        thread,
        meta: opts.meta,
        pr: opts.pr,
        runId: opts.runId,
        harvestedAt: opts.harvestedAt,
        classification,
      }),
    );
  }

  return { incoming, skipped, skippedOutdated };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  ensureGhAuth();

  const config = loadConfig();
  const meta = fetchPrMeta(args);
  const harvestedAt = new Date().toISOString();

  const threads = await fetchReviewThreads({
    owner: args.owner,
    repo: args.repo,
    pr: args.pr,
  });

  const { incoming, skipped, skippedOutdated } = collectHarvestRows({
    threads,
    config,
    meta,
    pr: args.pr,
    runId: args.runId,
    harvestedAt,
  });

  console.error(
    `harvest: PR #${args.pr} — ${incoming.length} thread(s) harvested, ` +
      `${skipped} ignored (config), ${skippedOutdated} skipped (outdated)`,
  );

  if (args.dryRun) {
    for (const row of incoming) {
      console.log(JSON.stringify(row));
    }
    return;
  }

  const merged = upsertRecords(readDebtRecords(), incoming);
  writeDebtRecords(merged);
  writeSummary(buildSummary(merged));

  console.error(`harvest: wrote ${incoming.length} row(s) to debt.jsonl`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
