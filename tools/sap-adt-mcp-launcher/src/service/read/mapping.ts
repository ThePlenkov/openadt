/**
 * Request/response mapping and formatting logic for read tools.
 * Shared between tool implementations to avoid duplication.
 */
import type { AdtObjectReference } from "../../config/types.ts";
import type { ReadObjectInput, ReadObjectResult } from "./client";

/** MCP CallToolResult shape (subset). */
export type CallToolResult = {
  content: { type: "text"; text: string }[];
  /** Machine-readable payload (like SAP tools' structuredContent). */
  structuredContent?: unknown;
  isError?: boolean;
};

export type ReferencesFormat = "json" | "markdown" | "compact";

function textResult(request: {
  text: string;
  isError?: boolean;
}): CallToolResult {
  return {
    content: [{ type: "text", text: request.text }],
    isError: request.isError,
  };
}

function jsonResult(request: {
  text: string;
  structuredContent: unknown;
}): CallToolResult {
  return {
    content: [{ type: "text", text: request.text }],
    structuredContent: request.structuredContent,
  };
}

function formatError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function parseReferencesFormat(value: unknown): ReferencesFormat {
  return value === "markdown" || value === "compact" ? value : "json";
}

/** Render a reference list as the chosen text format (structuredContent stays JSON). */
export function renderReferences(
  refs: AdtObjectReference[],
  request: { format: ReferencesFormat },
): string {
  const format = request.format;
  if (format === "markdown") {
    const head = "| Name | Type | Description |\n|------|------|-------------|";
    const rows = refs.map(
      (r) => `| ${r.name} | ${r.type ?? "?"} | ${r.description ?? ""} |`,
    );
    return [head, ...rows].join("\n");
  }
  if (format === "compact") {
    return refs
      .map(
        (r) =>
          `${r.name}${r.description ? ` — ${r.description}` : ""} (${r.type ?? "?"})`,
      )
      .join("\n");
  }
  return JSON.stringify({ references: refs }, null, 2);
}

/** Parse read-object tool arguments. */
export function parseReadObjectArgs(
  args: Record<string, unknown>,
): ReadObjectInput | undefined {
  const destination =
    typeof args.destination === "string" ? args.destination : undefined;
  const objectName =
    typeof args.objectName === "string" ? args.objectName : undefined;
  const uri = typeof args.uri === "string" ? args.uri : undefined;
  if (!destination) return undefined;
  if (!objectName && !uri) return undefined;
  const objectType =
    typeof args.objectType === "string" ? args.objectType : undefined;
  return { destination, objectName, objectType, uri };
}

/** Render a read-object result as MCP CallToolResult. */
export function renderReadObject(
  result: Extract<ReadObjectResult, { kind: "source" }>,
  request: { format: unknown },
): CallToolResult {
  const r = result.reference;
  const meta = {
    name: r.name,
    type: r.type,
    uri: r.uri,
    unsupported: result.unsupported,
  };
  if (request.format === "json") {
    return jsonResult({
      text: JSON.stringify({ ...meta, content: result.content }, null, 2),
      structuredContent: meta,
    });
  }
  const header = `* ${r.name} (${r.type ?? "?"}) — ${r.uri ?? ""}`.trimEnd();
  return {
    content: [{ type: "text", text: `${header}\n\n${result.content}` }],
    structuredContent: meta,
  };
}

/** Create an error CallToolResult. */
export function errorResult(message: string): CallToolResult {
  return textResult({ text: message, isError: true });
}

/** Create a JSON result with structured content. */
export function createJsonResult(
  text: string,
  structuredContent: unknown,
): CallToolResult {
  return jsonResult({ text, structuredContent });
}
