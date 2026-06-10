/**
 * URI helper for parsing and normalizing ADT URIs.
 * Extracts object type, name, package from ADT URIs.
 */

export interface ParsedAdtUri {
  type: string;
  name: string;
  package?: string;
  rawUri: string;
}

/**
 * Parse an ADT URI into its components.
 * Example: "/sap/bc/adt/vit/oo/clas/zcl_example" → { type: "CLAS", name: "ZCL_EXAMPLE", rawUri: "..." }
 */
export function parseAdtUri(uri: string): ParsedAdtUri {
  const rawUri = uri.startsWith("/") ? uri : `/${uri}`;

  // Try to extract type and name from common ADT URI patterns
  // Pattern: /sap/bc/adt/vit/oo/<type>/<name>
  const vitMatch = rawUri.match(/\/vit\/oo\/(\w+)\/([^/]+)/);
  if (vitMatch) {
    return {
      type: vitMatch[1].toUpperCase(),
      name: vitMatch[2].toUpperCase(),
      rawUri,
    };
  }

  // Pattern: /sap/bc/adt/objects/<type>/<name>
  const objectsMatch = rawUri.match(/\/objects\/(\w+)\/([^/]+)/);
  if (objectsMatch) {
    return {
      type: objectsMatch[1].toUpperCase(),
      name: objectsMatch[2].toUpperCase(),
      rawUri,
    };
  }

  // Fallback: extract last segment as name, second-to-last as type
  const segments = rawUri.split("/").filter(Boolean);
  if (segments.length >= 2) {
    return {
      type: segments[segments.length - 2].toUpperCase(),
      name: segments[segments.length - 1].toUpperCase(),
      rawUri,
    };
  }

  // Minimal fallback
  return {
    type: "UNKNOWN",
    name: segments[segments.length - 1] || "UNKNOWN",
    rawUri,
  };
}

/**
 * Extract destination from URI if embedded (for logging/throttling keys).
 */
export function extractDestination(uri: string): string {
  // ADT URIs don't typically embed destination, but if they do:
  const match = uri.match(/[?&]destination=([^&]+)/);
  return match ? match[1] : "default";
}
