#!/usr/bin/env bun
/**
 * Build a grouped batch plan for /act debt from the open ledger.
 *
 * Usage:
 *   bun scripts/act/plan-debt-batch.ts
 *   bun scripts/act/plan-debt-batch.ts --limit 25 --area scripts/act
 *   bun scripts/act/plan-debt-batch.ts --out /tmp/agent_$$/debt-batch-plan.md
 */
import { writeFileSync } from "node:fs";
import { readDebtRecords, type DebtRecord } from "./review-debt-lib.ts";

interface PlanArgs {
  limit: number;
  area: string | null;
  status: string;
  outPath: string | null;
}

function readOption(argv: string[], index: number): string | null {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    return null;
  }
  return value;
}

function parseArgs(argv: string[]): PlanArgs {
  const args: PlanArgs = {
    limit: 25,
    area: null,
    status: "open",
    outPath: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!;
    if (arg === "--limit") {
      const n = Number(readOption(argv, i));
      if (Number.isFinite(n) && n > 0) {
        args.limit = n;
      }
      i += 1;
      continue;
    }
    if (arg === "--area") {
      args.area = readOption(argv, i);
      i += 1;
      continue;
    }
    if (arg === "--status") {
      const s = readOption(argv, i);
      if (s) {
        args.status = s;
      }
      i += 1;
      continue;
    }
    if (arg === "--out") {
      args.outPath = readOption(argv, i);
      i += 1;
    }
  }

  return args;
}

function selectRows(records: DebtRecord[], args: PlanArgs): DebtRecord[] {
  let rows = records.filter((r) => r.status === args.status);
  if (args.area) {
    rows = rows.filter((r) => r.area.startsWith(args.area!));
  }
  return rows.slice(0, args.limit);
}

function groupByArea(rows: DebtRecord[]): Map<string, DebtRecord[]> {
  const groups = new Map<string, DebtRecord[]>();
  for (const row of rows) {
    const list = groups.get(row.area) ?? [];
    list.push(row);
    groups.set(row.area, list);
  }
  return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function renderPlan(rows: DebtRecord[], args: PlanArgs): string {
  const groups = groupByArea(rows);
  const lines: string[] = [
    "# Review debt batch plan",
    "",
    `Status filter: \`${args.status}\` · Limit: ${args.limit} · Selected: ${rows.length}`,
    "",
  ];

  for (const [area, items] of groups) {
    lines.push(`## ${area} (${items.length})`);
    lines.push("");
    for (const row of items) {
      lines.push(
        `- **PR #${row.source_pr}** [\`${row.priority}\`] \`${row.path}:${row.line ?? "-"}\``,
      );
      lines.push(`  - ${row.body_preview}`);
      lines.push(`  - thread: \`${row.thread_id}\``);
      lines.push(`  - ${row.thread_url}`);
    }
    lines.push("");
  }

  lines.push("## Agent checklist");
  lines.push("");
  lines.push("1. Branch `cursor/review-debt-YYYY-MM-DD-f7a9`");
  lines.push("2. Fix by area (commits grouped by theme)");
  lines.push("3. Open PR listing source PR numbers + thread ids above");
  lines.push(
    "4. After merge: `bun scripts/act/update-debt-status.ts --status done --fix-pr N --threads-file …`",
  );

  return `${lines.join("\n")}\n`;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const rows = selectRows(readDebtRecords(), args);
  const plan = renderPlan(rows, args);

  if (args.outPath) {
    writeFileSync(args.outPath, plan, "utf8");
    console.error(`wrote ${rows.length} item(s) to ${args.outPath}`);
    return;
  }

  console.log(plan);
}

main();
