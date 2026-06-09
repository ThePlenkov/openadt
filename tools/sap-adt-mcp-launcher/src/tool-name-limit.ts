import { createHash } from "node:crypto";

/** Default max MCP tool name length exposed over stdio (before client prefix). */
export const DEFAULT_MAX_MCP_TOOL_NAME_LEN = 45;
// Bedrock/Claude prefix budget: specs/mcp.md § Agent backend tool name limits

/** Minimum supported `maxLen` — keeps the `_x<hash>` suffix (8 chars) from overflowing the alias. */
export const MIN_REGISTRY_MAX_LEN = 9;

/** Upper bound for `OPENADT_MCP_MAX_TOOL_NAME` — Bedrock/Claude prefix (7) + name must be ≤ 64. */
export const MAX_MCP_TOOL_NAME_LEN_CEILING = 57;

export function maxMcpToolNameLenFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): number {
  const raw = env.OPENADT_MCP_MAX_TOOL_NAME?.trim();
  if (!raw) {
    return DEFAULT_MAX_MCP_TOOL_NAME_LEN;
  }
  const parsed = Number.parseInt(raw, 10);
  if (
    !Number.isFinite(parsed) ||
    parsed < 16 ||
    parsed > MAX_MCP_TOOL_NAME_LEN_CEILING
  ) {
    return DEFAULT_MAX_MCP_TOOL_NAME_LEN;
  }
  return parsed;
}

/** Maps long SAP tool names to shorter aliases for agent backends with name limits. */
export class ToolNameRegistry {
  private readonly toAlias = new Map<string, string>();
  private readonly fromAlias = new Map<string, string>();

  private readonly maxLen: number;

  constructor(maxLen: number) {
    this.maxLen = Math.max(MIN_REGISTRY_MAX_LEN, maxLen);
  }

  exportName(original: string): string {
    if (original.length <= this.maxLen) {
      return original;
    }
    const existing = this.toAlias.get(original);
    if (existing) {
      return existing;
    }
    const alias = this.makeAlias(original);
    this.toAlias.set(original, alias);
    this.fromAlias.set(alias, original);
    return alias;
  }

  importName(exposed: string): string {
    return this.fromAlias.get(exposed) ?? exposed;
  }

  private makeAlias(original: string): string {
    const hash = createHash("sha256")
      .update(original)
      .digest("hex")
      .slice(0, 6);
    const suffix = `_x${hash}`;
    const prefixLen = Math.max(1, this.maxLen - suffix.length);
    return `${original.slice(0, prefixLen)}${suffix}`;
  }
}

/** Shorten tool names in a backend `tools/list` JSON-RPC response body. */
export function shortenToolsInListResponse(
  msg: string,
  reqId: ParsedRpcId,
  method: string | undefined,
  registry: ToolNameRegistry,
): string {
  if (method !== "tools/list") {
    return msg;
  }
  let parsed: { id?: unknown; result?: { tools?: unknown } };
  try {
    parsed = JSON.parse(msg);
  } catch {
    return msg;
  }
  if (parsed.id !== reqId || !parsed.result) {
    return msg;
  }
  if (!Array.isArray(parsed.result.tools)) {
    return msg;
  }
  parsed.result.tools = parsed.result.tools.map((tool) => {
    if (!tool || typeof tool !== "object") {
      return tool;
    }
    const entry = tool as { name?: unknown };
    if (typeof entry.name !== "string") {
      return tool;
    }
    return { ...entry, name: registry.exportName(entry.name) };
  });
  return JSON.stringify(parsed);
}

type ParsedRpcId = string | number | null | undefined;

/** Rewrite a `tools/call` request body to use the backend SAP tool name. */
export function rewriteToolsCallRequest(
  body: string,
  registry: ToolNameRegistry,
): string {
  let parsed: {
    method?: unknown;
    params?: { name?: unknown; arguments?: unknown };
  };
  try {
    parsed = JSON.parse(body);
  } catch {
    return body;
  }
  if (parsed.method !== "tools/call" || !parsed.params) {
    return body;
  }
  const exposed =
    typeof parsed.params.name === "string" ? parsed.params.name : "";
  const original = registry.importName(exposed);
  if (original === exposed) {
    return body;
  }
  parsed.params = { ...parsed.params, name: original };
  return JSON.stringify(parsed);
}
