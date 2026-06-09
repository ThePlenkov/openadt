#!/usr/bin/env bun
/**
 * Update review-debt ledger row status (after /act debt batch PR).
 *
 * Usage:
 *   bun run act:debt:done -- --thread-id PRRT_… --status done --fix-pr 99
 *   bun run act:debt:done -- --fix-pr 99 --status done --threads-file /tmp/agent/threads.txt
 *   bun run act:debt:done -- --status wontfix --thread-id PRRT_… --notes "out of scope"
 */
import { readFileSync } from "node:fs";
import {
  buildSummary,
  readDebtRecords,
  writeDebtRecords,
  writeSummary,
  type DebtRecord,
  type DebtStatus,
} from "./review-debt-lib.ts";

interface StatusArgs {
  threadIds: string[];
  status: DebtStatus;
  fixPr: number | null;
  notes: string | null;
}

const VALID: DebtStatus[] = ["open", "claimed", "done", "wontfix", "duplicate"];

function readOption(argv: string[], index: number): string | null {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    return null;
  }
  return value;
}

function parseThreadFile(path: string): string[] {
  const raw = readFileSync(path, "utf8");
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

interface ParseState {
  threadIds: string[];
  status: DebtStatus | null;
  fixPr: number | null;
  notes: string | null;
  threadsFile: string | null;
}

function initialState(): ParseState {
  return {
    threadIds: [],
    status: null,
    fixPr: null,
    notes: null,
    threadsFile: null,
  };
}

const STATUS_FLAG_HANDLERS: Record<
  string,
  (state: ParseState, argv: string[], i: number) => number
> = {
  "--thread-id": (state, argv, i) => {
    const id = readOption(argv, i);
    if (id) {
      state.threadIds.push(id);
    }
    return i + 1;
  },
  "--threads-file": (state, argv, i) => {
    state.threadsFile = readOption(argv, i);
    return i + 1;
  },
  "--status": (state, argv, i) => {
    const value = readOption(argv, i) as DebtStatus | null;
    if (value && VALID.includes(value)) {
      state.status = value;
    }
    return i + 1;
  },
  "--fix-pr": (state, argv, i) => {
    const n = Number(readOption(argv, i));
    if (Number.isFinite(n)) {
      state.fixPr = n;
    }
    return i + 1;
  },
  "--notes": (state, argv, i) => {
    state.notes = readOption(argv, i);
    return i + 1;
  },
};

function parseArgs(argv: string[]): StatusArgs {
  const state = initialState();

  for (let i = 0; i < argv.length; i += 1) {
    const handler = STATUS_FLAG_HANDLERS[argv[i]!];
    if (handler) {
      i = handler(state, argv, i);
    }
  }

  if (state.threadsFile) {
    state.threadIds.push(...parseThreadFile(state.threadsFile));
  }

  if (!state.status || state.threadIds.length === 0) {
    console.error(
      "Usage: update-debt-status.ts --status done|wontfix|claimed|open|duplicate " +
        "--thread-id ID [--thread-id ID2 …] | --threads-file PATH " +
        "[--fix-pr N] [--notes TEXT]",
    );
    process.exit(2);
  }

  return {
    threadIds: [...new Set(state.threadIds)],
    status: state.status,
    fixPr: state.fixPr,
    notes: state.notes,
  };
}

function applyStatus(
  records: DebtRecord[],
  args: StatusArgs,
): { updated: number; missing: string[] } {
  const wanted = new Set(args.threadIds);
  const missing = new Set(args.threadIds);
  const now = new Date().toISOString();
  let updated = 0;

  const next = records.map((row) => {
    if (!wanted.has(row.thread_id)) {
      return row;
    }
    missing.delete(row.thread_id);
    updated += 1;
    return {
      ...row,
      status: args.status,
      fix_pr: args.fixPr ?? row.fix_pr,
      fixed_at:
        args.status === "done" || args.status === "wontfix"
          ? now
          : row.fixed_at,
      notes: args.notes ?? row.notes,
    };
  });

  writeDebtRecords(next);
  writeSummary(buildSummary(next));

  return { updated, missing: [...missing] };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const records = readDebtRecords();
  const result = applyStatus(records, args);

  console.error(
    `update-debt-status: ${result.updated} row(s) → ${args.status}`,
  );
  if (result.missing.length > 0) {
    console.error(
      `warning: thread id(s) not in ledger: ${result.missing.join(", ")}`,
    );
    process.exit(1);
  }
}

main();
