import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateAssert, extractToolPayload } from "./assertions";
import type { CliOptions } from "./context";
import { buildRunContext, resolveDestinationId } from "./context";
import {
  createEvidencePath,
  defaultEvidenceRoot,
  resolveRepoRoot,
  writeEvidenceReport,
} from "./evidence";
import { McpStdioClient } from "./mcp-stdio-client";
import { filterScenarios, loadScenarios } from "./scenarios";
import { redact, substituteArgs, substituteAssert } from "./template";
import type { Scenario, ScenarioResult, StepResult } from "./types";

const aiTestsRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const launcher = join(aiTestsRoot, "..", "src", "cli", "main.ts");

export type RunAiTestsOutcome = {
  exitCode: number;
  evidencePath?: string;
};

export function printCatalog(scenarios: Scenario[]): void {
  console.log(
    "MCP AI scenarios (one .md per scenario — pass --destination at run time):\n",
  );
  for (const s of scenarios) {
    console.log(`• ${s.code} — ${s.title}`);
    console.log(`  id: ${s.id}`);
    console.log(`  file: scenarios/${s.file}`);
    console.log(`  mode: ${s.mode ?? "standalone"}`);
    const preview = s.intent.replace(/\s+/g, " ").slice(0, 100);
    console.log(`  brief: ${preview}…\n`);
  }
}

export async function runAiTests(opts: CliOptions): Promise<RunAiTestsOutcome> {
  const scenarios = loadScenarios(aiTestsRoot);
  if (opts.list) {
    printCatalog(scenarios);
    return { exitCode: 0 };
  }

  const startedAt = new Date().toISOString();
  const destination = resolveDestinationId(opts);
  const ctx = buildRunContext(opts, destination);
  const selected = filterScenarios(scenarios, opts.scenario);

  const evidenceRoot =
    opts.evidenceRoot ??
    defaultEvidenceRoot(resolveRepoRoot(aiTestsRoot));
  const testId = selected.map((s) => s.code).join("_");
  const writeEvidence = opts.evidence;

  console.log(`=== MCP AI tests ===`);
  console.log(`destination: ${redact(destination, ctx)}`);
  console.log(
    `scenarios: ${selected.map((s) => `${s.code} (${s.id})`).join(", ")}\n`,
  );
  if (writeEvidence) {
    console.log(`evidence: ${evidenceRoot} (filename gets ✅/❌ on completion)\n`);
  }

  const mcpMode = selected.some((s) => (s.mode ?? "standalone") === "shared")
    ? "shared"
    : "standalone";
  const client = new McpStdioClient(launcher, ctx, mcpMode);

  const timeout = setTimeout(() => {
    console.error("Run timeout — SSO/logon may be stuck");
    client.close();
  }, ctx.timeoutMs).unref();

  let exitCode = 1;
  const results: ScenarioResult[] = [];
  try {
    await client.start();
    for (const scenario of selected) {
      results.push(await runScenario(client, scenario, ctx));
    }
    printSummary(results);
    exitCode = results.every((r) => r.passed) ? 0 : 1;
  } finally {
    clearTimeout(timeout);
    client.close();
  }

  let evidencePath: string | undefined;
  if (writeEvidence) {
    const passed = exitCode === 0;
    const { runId, path } = createEvidencePath(
      evidenceRoot,
      testId,
      passed,
      startedAt,
    );
    writeEvidenceReport({
      path,
      runId,
      startedAt,
      finishedAt: new Date().toISOString(),
      exitCode,
      opts,
      ctx,
      scenarios: selected,
      results,
      mcpMode,
    });
    evidencePath = path;
    console.log(`\nEvidence written: ${path}`);
  }

  return { exitCode, evidencePath };
}

async function runScenario(
  client: McpStdioClient,
  scenario: Scenario,
  ctx: ReturnType<typeof buildRunContext>,
): Promise<ScenarioResult> {
  console.log(`--- ${scenario.code} ${scenario.id}: ${scenario.title} ---`);
  const steps: StepResult[] = [];
  for (const step of scenario.steps) {
    const args = substituteArgs(step.args, ctx);
    const t0 = Date.now();
    let result: unknown;
    try {
      result = await client.callTool(step.tool, args);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`✗ ${step.tool}: ${redact(msg, ctx)}`);
      steps.push({
        tool: step.tool,
        ok: false,
        detail: msg,
        durationMs: Date.now() - t0,
        args,
        mcpReplied: false,
        checks: [
          {
            name: "mcp_replied",
            expected: "MCP tool returned a response",
            actual: `transport error: ${msg}`,
            passed: false,
          },
        ],
      });
      continue;
    }
    const payload = extractToolPayload(result);
    const verdict = evaluateAssert(substituteAssert(step.assert, ctx), payload);
    const icon = verdict.ok ? "✓" : "✗";
    console.log(`${icon} ${step.tool}: ${redact(verdict.detail, ctx)}`);
    steps.push({
      tool: step.tool,
      ok: verdict.ok,
      detail: verdict.detail,
      durationMs: Date.now() - t0,
      args,
      mcpReplied: true,
      isError: payload.isError,
      checks: verdict.checks,
      responseBody: redact(payload.contentText.slice(0, 4000), ctx),
    });
  }
  const passed = steps.every((s) => s.ok);
  return {
    code: scenario.code,
    id: scenario.id,
    title: scenario.title,
    passed,
    steps,
  };
}

function printSummary(results: ScenarioResult[]): void {
  const passed = results.filter((r) => r.passed).length;
  console.log(`\n=== Summary: ${passed}/${results.length} scenarios passed ===`);
  for (const r of results) {
    console.log(`${r.passed ? "✓" : "✗"} ${r.code} ${r.id}`);
  }
}
