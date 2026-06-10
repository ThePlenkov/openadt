import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import type { Scenario, ScenarioCode, ScenarioStep } from "./types";

export function scenariosDir(root: string): string {
  return join(root, "scenarios");
}

type Frontmatter = {
  code?: string;
  id?: string;
  title?: string;
  tags?: string[];
  mode?: Scenario["mode"];
  given?: string;
  when?: string;
  then?: string;
  steps?: ScenarioStep[];
};

const CODE_RE = /^mcp-\d+$/;
const FILE_RE = /^mcp-\d+-[\w-]+\.md$/;

/** Expected basename: `mcp-N-<id>.md` (sorted by N, readable slug from frontmatter `id`). */
export function expectedScenarioFilename(
  code: ScenarioCode,
  id: string,
): string {
  return `${code}-${id}.md`;
}

export function normalizeScenarioCode(raw: string): ScenarioCode {
  const code = raw.trim().toLowerCase();
  if (!CODE_RE.test(code)) {
    throw new Error(
      `Invalid scenario code "${raw}" (expected mcp-1, mcp-2, …)`,
    );
  }
  return code as ScenarioCode;
}

/** Split YAML frontmatter and markdown body (`---` … `---`). */
export function parseScenarioMarkdown(raw: string): {
  meta: Frontmatter;
  body: string;
} {
  const trimmed = raw.replace(/^\uFEFF/, "").trimStart();
  if (!trimmed.startsWith("---")) {
    throw new Error("Scenario .md must start with YAML frontmatter (---)");
  }
  const end = trimmed.indexOf("\n---", 3);
  if (end < 0) {
    throw new Error("Scenario .md frontmatter not closed with ---");
  }
  const yamlBlock = trimmed.slice(3, end).trim();
  const body = trimmed.slice(end + 4).trim();
  const meta = yaml.load(yamlBlock) as Frontmatter;
  return { meta, body };
}

export function toScenario(
  file: string,
  meta: Frontmatter,
  body: string,
): Scenario {
  if (!meta.code) {
    throw new Error(`Invalid scenario file: ${file} (missing code: mcp-N)`);
  }
  if (!meta.id || !meta.steps?.length) {
    throw new Error(
      `Invalid scenario file: ${file} (need id + steps in frontmatter)`,
    );
  }
  if (!body) {
    throw new Error(
      `Invalid scenario file: ${file} (markdown body required for agent brief)`,
    );
  }
  for (const key of ["given", "when", "then"] as const) {
    if (!meta[key]?.trim()) {
      throw new Error(
        `Invalid scenario file: ${file} (frontmatter requires ${key})`,
      );
    }
  }
  const code = normalizeScenarioCode(meta.code);
  const expected = expectedScenarioFilename(code, meta.id);
  if (!FILE_RE.test(file)) {
    throw new Error(
      `Invalid scenario file: ${file} (filename must match mcp-N-<id>.md)`,
    );
  }
  if (file !== expected) {
    throw new Error(
      `Invalid scenario file: ${file} (expected ${expected} for code=${code}, id=${meta.id})`,
    );
  }
  return {
    code,
    id: meta.id,
    file,
    title: meta.title ?? meta.id,
    tags: meta.tags,
    mode: meta.mode,
    given: meta.given!.trim(),
    when: meta.when!.trim(),
    then: meta.then!.trim(),
    intent: body,
    steps: meta.steps,
  };
}

function assertUniqueCodes(scenarios: Scenario[]): void {
  const seen = new Map<string, string>();
  for (const s of scenarios) {
    const prev = seen.get(s.code);
    if (prev) {
      throw new Error(`Duplicate scenario code ${s.code}: ${prev} and ${s.id}`);
    }
    seen.set(s.code, s.id);
  }
}

export function loadScenarios(root: string): Scenario[] {
  const dir = scenariosDir(root);
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  const out: Scenario[] = [];
  for (const file of files.sort()) {
    const raw = readFileSync(join(dir, file), "utf8");
    const { meta, body } = parseScenarioMarkdown(raw);
    out.push(toScenario(file, meta, body));
  }
  assertUniqueCodes(out);
  return out.sort((a, b) => codeOrder(a.code) - codeOrder(b.code));
}

function codeOrder(code: ScenarioCode): number {
  return Number(code.slice("mcp-".length));
}

/** Match by stable code (`mcp-3`) or slug id (`search-objects`). */
export function filterScenarios(
  all: Scenario[],
  selector: string | undefined,
): Scenario[] {
  if (!selector) return all;
  const key = selector.trim().toLowerCase();
  const hit = all.filter((s) => scenarioMatchesSelector(s, key));
  if (hit.length === 0) {
    throw new Error(
      `Unknown scenario: ${selector} (use mcp-N or slug id; bun run mcp:ai-tests -- --list)`,
    );
  }
  return hit;
}

function scenarioMatchesSelector(s: Scenario, key: string): boolean {
  if (s.id.toLowerCase() === key) return true;
  if (s.code === key) return true;
  if (!CODE_RE.test(key)) return false;
  return s.code === normalizeScenarioCode(key);
}

export function findScenarioByCode(
  all: Scenario[],
  code: string,
): Scenario | undefined {
  try {
    const normalized = normalizeScenarioCode(code);
    return all.find((s) => s.code === normalized);
  } catch {
    return undefined;
  }
}
