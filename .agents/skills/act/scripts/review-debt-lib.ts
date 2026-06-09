/**
 * Shared types and helpers for review-debt harvest + query scripts.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** Repo-relative when skill lives under `.agents/skills/act/`; override via env in tests. */
export const DEBT_DIR = join(import.meta.dir, "../../../review-debt");
export const DEBT_FILE =
  process.env.OPENADT_DEBT_FILE ?? join(DEBT_DIR, "debt.jsonl");
export const SUMMARY_FILE =
  process.env.OPENADT_DEBT_SUMMARY ?? join(DEBT_DIR, "debt-summary.json");
export const CONFIG_FILE = join(DEBT_DIR, "config.json");

export type DebtStatus = "open" | "claimed" | "done" | "wontfix" | "duplicate";
export type DebtPriority = "blocking" | "human" | "nit" | "scan" | "noise";
export type DebtNeeds = "code_change" | "reply_only" | "skip";

export interface DebtRecord {
  thread_id: string;
  thread_url: string;
  status: DebtStatus;
  priority: DebtPriority;
  needs: DebtNeeds;
  source_pr: number;
  source_pr_url: string;
  source_pr_title: string;
  merged_at: string;
  merged_sha: string;
  path: string;
  line: number | null;
  author: string;
  body: string;
  body_preview: string;
  fingerprint: string;
  area: string;
  harvested_at: string;
  harvest_run_id: string;
  times_seen: number;
  fix_pr: number | null;
  fixed_at: string | null;
  notes: string | null;
}

export interface DebtConfig {
  ignore_authors: string[];
  nit_authors: string[];
}

export interface ReviewThreadComment {
  author: { login?: string };
  path?: string;
  line?: number | null;
  body?: string;
}

export interface ReviewThreadNode {
  id: string;
  isResolved: boolean;
  isOutdated: boolean;
  comments: { nodes: ReviewThreadComment[] };
}

export interface DebtSummary {
  generated_at: string;
  open_count: number;
  by_area: Record<string, number>;
  by_author: Record<string, number>;
  duplicate_fingerprints: Array<{
    fingerprint: string;
    count: number;
    prs: number[];
  }>;
  oldest_open: string | null;
}

export function loadConfig(): DebtConfig {
  const fallback: DebtConfig = { ignore_authors: [], nit_authors: [] };
  if (!existsSync(CONFIG_FILE)) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(readFileSync(CONFIG_FILE, "utf8")) as DebtConfig;
    return {
      ignore_authors: parsed.ignore_authors ?? [],
      nit_authors: parsed.nit_authors ?? [],
    };
  } catch {
    return fallback;
  }
}

export function readDebtRecords(): DebtRecord[] {
  if (!existsSync(DEBT_FILE)) {
    return [];
  }
  return readFileSync(DEBT_FILE, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as DebtRecord);
}

export function writeDebtRecords(records: DebtRecord[]): void {
  mkdirSync(dirname(DEBT_FILE), { recursive: true });
  const lines = records.map((r) => JSON.stringify(r)).join("\n");
  writeFileSync(DEBT_FILE, lines.length > 0 ? `${lines}\n` : "", "utf8");
}

export function upsertRecords(
  existing: DebtRecord[],
  incoming: DebtRecord[],
): DebtRecord[] {
  const byId = new Map(existing.map((r) => [r.thread_id, r]));
  for (const row of incoming) {
    const prev = byId.get(row.thread_id);
    if (!prev) {
      byId.set(row.thread_id, row);
      continue;
    }
    if (prev.status === "done" || prev.status === "wontfix") {
      // Re-harvest means the thread is still unresolved on GitHub — reopen.
      byId.set(row.thread_id, {
        ...row,
        times_seen: prev.times_seen + 1,
        status: "open",
        fix_pr: null,
        fixed_at: null,
        notes: null,
      });
      continue;
    }
    byId.set(row.thread_id, {
      ...row,
      times_seen: prev.times_seen + 1,
      status: prev.status === "claimed" ? "claimed" : row.status,
      fix_pr: prev.fix_pr,
      fixed_at: prev.fixed_at,
      notes: prev.notes,
    });
  }
  return [...byId.values()].sort((a, b) =>
    a.harvested_at.localeCompare(b.harvested_at),
  );
}

export function buildSummary(records: DebtRecord[]): DebtSummary {
  const open = records.filter((r) => r.status === "open");
  const byArea: Record<string, number> = {};
  const byAuthor: Record<string, number> = {};
  for (const row of open) {
    byArea[row.area] = (byArea[row.area] ?? 0) + 1;
    byAuthor[row.author] = (byAuthor[row.author] ?? 0) + 1;
  }

  const fpMap = new Map<string, { count: number; prs: Set<number> }>();
  for (const row of open) {
    const entry = fpMap.get(row.fingerprint) ?? {
      count: 0,
      prs: new Set<number>(),
    };
    entry.count += 1;
    entry.prs.add(row.source_pr);
    fpMap.set(row.fingerprint, entry);
  }

  const duplicate_fingerprints = [...fpMap.entries()]
    .filter(([, v]) => v.count > 1)
    .map(([fingerprint, v]) => ({
      fingerprint,
      count: v.count,
      prs: [...v.prs].sort((a, b) => a - b),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    generated_at: new Date().toISOString(),
    open_count: open.length,
    by_area: byArea,
    by_author: byAuthor,
    duplicate_fingerprints,
    oldest_open: oldestOpenHarvest(open),
  };
}

function oldestOpenHarvest(open: DebtRecord[]): string | null {
  if (open.length === 0) {
    return null;
  }
  return open.reduce(
    (min, row) => (row.harvested_at < min ? row.harvested_at : min),
    open[0]!.harvested_at,
  );
}

export function writeSummary(summary: DebtSummary): void {
  mkdirSync(dirname(SUMMARY_FILE), { recursive: true });
  writeFileSync(SUMMARY_FILE, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
}

export function classifyThread(opts: { author: string; config: DebtConfig }): {
  priority: DebtPriority;
  needs: DebtNeeds;
  harvest: boolean;
} {
  const login = opts.author.toLowerCase();
  if (opts.config.ignore_authors.some((a) => a.toLowerCase() === login)) {
    return { priority: "noise", needs: "skip", harvest: false };
  }
  const isBot = login.endsWith("[bot]");
  if (!isBot) {
    return { priority: "human", needs: "code_change", harvest: true };
  }
  if (opts.config.nit_authors.some((a) => a.toLowerCase() === login)) {
    return { priority: "nit", needs: "code_change", harvest: true };
  }
  return { priority: "nit", needs: "code_change", harvest: true };
}
