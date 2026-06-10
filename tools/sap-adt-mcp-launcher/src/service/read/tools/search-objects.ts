/**
 * adt_search_objects MCP tool implementation.
 * Searches ABAP repository objects by name pattern using the shared read backend.
 */
import type { ReadObjectBackend } from "../client.ts";
import type { CallToolResult } from "../mapping.ts";
import {
  renderReferences,
  parseReferencesFormat,
  createJsonResult,
  errorResult,
} from "../mapping.ts";

export const SEARCH_OBJECTS_TOOL = "adt_search_objects";

/** MCP tool definition for adt_search_objects. */
export function searchObjectsToolDef(): object {
  return {
    name: SEARCH_OBJECTS_TOOL,
    description:
      "Search ABAP repository objects by name pattern (RIS quick search). " +
      "Returns matching objects with their name, type and ADT path.",
    inputSchema: {
      type: "object",
      properties: {
        destination: { type: "string", description: "Destination id." },
        pattern: {
          type: "string",
          description:
            "Name pattern, e.g. CL_ABAP_TYPE* (RIS facet syntax supported).",
        },
        types: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional ADT type codes to filter by, e.g. CLAS/OC, INTF/OI, DDLS/DF. " +
            "(The result's `type` is a display label like 'Class' — not a filter value.)",
        },
        maxResults: {
          type: "integer",
          description: "Maximum number of results (default 50).",
        },
        format: {
          type: "string",
          enum: ["json", "markdown", "compact"],
          description:
            "Text output format (default 'json'). structuredContent is always JSON.",
        },
      },
      required: ["destination", "pattern"],
    },
  };
}

/** Handle adt_search_objects tool call. */
export async function handleSearchObjectsTool(
  backend: ReadObjectBackend,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const destination = String(args.destination ?? "");
  const pattern = String(args.pattern ?? "");
  if (!destination || !pattern) {
    return errorResult("destination and pattern are required");
  }
  const types = Array.isArray(args.types)
    ? args.types.filter((t): t is string => typeof t === "string")
    : undefined;
  const maxResults =
    typeof args.maxResults === "number" ? args.maxResults : undefined;
  const references = await backend.search({
    destination,
    pattern,
    types,
    maxResults,
  });
  return createJsonResult(
    renderReferences(references, {
      format: parseReferencesFormat(args.format),
    }),
    { references },
  );
}
