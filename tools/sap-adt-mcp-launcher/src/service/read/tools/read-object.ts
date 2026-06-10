/**
 * adt_read_object MCP tool implementation.
 * Reads ABAP object source by name using the shared read backend.
 */
import type { ReadObjectBackend } from "../client.ts";
import type { ReadObjectInput } from "../client.ts";
import type { CallToolResult } from "../mapping.ts";
import {
  parseReadObjectArgs,
  renderReadObject,
  createJsonResult,
  errorResult,
} from "../mapping.ts";

export const READ_OBJECT_TOOL = "adt_read_object";

/** MCP tool definition for adt_read_object. */
export function readObjectToolDef(): object {
  return {
    name: READ_OBJECT_TOOL,
    description:
      "Read an ABAP object's source by name (emulates VS Code 'Open ABAP Object'). " +
      "Returns the source for modern/RAP types (classes, interfaces, CDS/DDLS, " +
      "service bindings, behavior/service definitions); classic types (programs, " +
      "tables, function groups) return an 'open in Eclipse' note from ADT.",
    inputSchema: {
      type: "object",
      properties: {
        destination: {
          type: "string",
          description: "Destination id, e.g. ABC_000_USER_EN.",
        },
        objectName: {
          type: "string",
          description:
            "Object name, e.g. CL_ABAP_TYPEDESCR (provide this or uri).",
        },
        objectType: {
          type: "string",
          description:
            "Optional ADT type code to narrow the name search, e.g. CLAS/OC, INTF/OI, " +
            "DDLS/DF. NOTE: this is the code adt-ls's search filters on — not the " +
            "display label ('Class') it returns.",
        },
        uri: {
          type: "string",
          description:
            "ADT object path from a search result (e.g. /sap/bc/adt/oo/classes/cl_x). " +
            "When given, the object is read directly — no name lookup or type needed.",
        },
        format: {
          type: "string",
          enum: ["source", "json"],
          description:
            "Text output: 'source' (default, raw ABAP) or 'json' (metadata + content). structuredContent is always JSON.",
        },
      },
      required: ["destination"],
    },
  };
}

/** Handle adt_read_object tool call. */
export async function handleReadObjectTool(
  backend: ReadObjectBackend,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const input = parseReadObjectArgs(args);
  if (!input) {
    return errorResult("destination and (objectName or uri) are required");
  }
  const result = await backend.readObject(input);
  if (result.kind === "ambiguous") {
    return createJsonResult(
      `Multiple objects match '${input.objectName}'. Pass objectType (ADT code, e.g. CLAS/OC) ` +
        `or a uri to disambiguate. Candidates:\n` +
        JSON.stringify(result.candidates, null, 2),
      { ambiguous: true, candidates: result.candidates },
    );
  }
  return renderReadObject(result, { format: args.format });
}
