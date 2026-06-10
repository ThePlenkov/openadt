/**
 * Shared LSP client logic for reading ABAP objects.
 * Contains LSP wrappers, backend implementations, and retry logic.
 */
import {
  ParameterStructures,
  type MessageConnection,
} from "../../infra/rpc.ts";
import { sleep } from "../../infra/process.ts";
import {
  LSP_METHOD_FILESYSTEM_READ_FILE,
  LSP_METHOD_REPOSITORY_GET_LS_URI,
  LSP_METHOD_REPOSITORY_QUICK_SEARCH,
  type AdtObjectReference,
  type QuickSearchResult,
} from "../../config/types.ts";

/** Whether the read tools are enabled (default on). */
export function readEnabled(): boolean {
  return !process.env.OPENADT_MCP_NO_READ;
}

/** adt-ls returns this placeholder (not source) for types it can't serve headless. */
export function isUnsupportedPlaceholder(content: string): boolean {
  return /not supported in ADT in VS Code/i.test(content);
}

/**
 * Minimal LSP request surface — decouples this module from `MessageConnection`
 * for testing and lets an HTTP-backed implementation reuse the same wrappers.
 */
export type LspRequester = <T>(method: string, params: object) => Promise<T>;

/** Adapt an `adt-lsc` `MessageConnection` to an `LspRequester` (named params). */
export function connectionRequester(
  connection: MessageConnection,
): LspRequester {
  return <T>(method: string, params: object): Promise<T> =>
    connection.sendRequest(
      method,
      ParameterStructures.byName,
      params,
    ) as Promise<T>;
}

// ---- LSP wrappers (1:1 with the adt-lsc methods) ---------------------------

export function quickSearch(
  req: LspRequester,
  params: {
    destination: string;
    pattern: string;
    maxResults?: number;
    types?: string[];
  },
): Promise<QuickSearchResult> {
  return req<QuickSearchResult>(LSP_METHOD_REPOSITORY_QUICK_SEARCH, {
    destination: params.destination,
    pattern: params.pattern,
    maxResults: params.maxResults ?? 50,
    types: params.types ?? [],
  });
}

export async function getLsUri(
  req: LspRequester,
  request: { destination: string; adtUri: string },
): Promise<string> {
  const r = await req<{ uri?: string }>(LSP_METHOD_REPOSITORY_GET_LS_URI, {
    destination: request.destination,
    adtUri: request.adtUri,
  });
  if (!r.uri) {
    throw new Error(`getLsUri returned no uri for ${request.adtUri}`);
  }
  return r.uri;
}

export async function readFile(
  req: LspRequester,
  uri: string,
): Promise<string> {
  const r = await req<{ content?: string }>(LSP_METHOD_FILESYSTEM_READ_FILE, {
    uri,
  });
  return r.content ?? "";
}

// ---- "never return empty" retry-until-deadline -----------------------------

export class ReadTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReadTimeoutError";
  }
}

export type RetryOptions = { timeoutMs?: number; intervalMs?: number };

const DEFAULT_TIMEOUT_MS = 25_000; // under SAP MCP's 30s request timeout
const DEFAULT_INTERVAL_MS = 600;

/**
 * Run `fn` until it returns a non-empty value or the deadline passes. An empty
 * result (or a transient throw) is retried with a fixed interval; if still empty
 * at the deadline we throw `ReadTimeoutError` rather than surface the empty value.
 */
export async function retryUntilNonEmpty<T>(
  fn: () => Promise<T>,
  isEmpty: (value: T) => boolean,
  label: string,
  options: RetryOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  for (;;) {
    try {
      const value = await fn();
      if (!isEmpty(value)) {
        return value;
      }
    } catch (err) {
      lastError = err;
    }
    if (Date.now() + intervalMs >= deadline) {
      const cause = lastError ? `; last error: ${formatError(lastError)}` : "";
      throw new ReadTimeoutError(
        `${label}: no result within ${timeoutMs}ms — object may be missing, ` +
          `or the SAP backend is still warming / the session expired${cause}`,
      );
    }
    await sleep(intervalMs);
  }
}

function formatError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Last non-empty path segment of an ADT uri, upper-cased (a best-effort name). */
export function lastUriSegment(uri: string): string {
  const segs = uri.split("/").filter(Boolean);
  return (segs[segs.length - 1] ?? uri).toUpperCase();
}

// ---- reference selection ---------------------------------------------------

/**
 * Pick the reference matching `name` (case-insensitive), optionally filtered by
 * `type`. Returns `{ match }` on a single best hit, or `{ candidates }` when the
 * name is ambiguous / no exact match (so the caller can disambiguate rather than
 * guess). `refs` is assumed non-empty.
 */
export function pickReference(
  refs: AdtObjectReference[],
  request: { name: string; type?: string },
): { match: AdtObjectReference } | { candidates: AdtObjectReference[] } {
  const pool = poolForType(refs, request);
  const exact = exactNameMatches(pool, request);
  if (exact.length === 1) {
    return { match: exact[0]! };
  }
  if (exact.length === 0 && pool.length === 1) {
    return { match: pool[0]! };
  }
  return { candidates: exact.length > 0 ? exact : pool };
}

/** Narrow `refs` to those whose `type` matches (uppercased). Fall back to `refs` when no type or none match. */
function poolForType(
  refs: AdtObjectReference[],
  request: { type?: string },
): AdtObjectReference[] {
  if (!request.type) return refs;
  const target = request.type.toUpperCase();
  const filtered = refs.filter((r) => r.type?.toUpperCase() === target);
  return filtered.length > 0 ? filtered : refs;
}

function exactNameMatches(
  refs: AdtObjectReference[],
  request: { name: string },
): AdtObjectReference[] {
  const target = request.name.toUpperCase();
  return refs.filter((r) => r.name?.toUpperCase() === target);
}

// ---- backend abstraction (transport-agnostic) ------------------------------

export type ReadObjectInput = {
  destination: string;
  /** Object name to resolve via quickSearch. Provide this OR `uri`. */
  objectName?: string;
  /** ADT type code (e.g. CLAS/OC) to narrow the name search. Not the display label. */
  objectType?: string;
  /** ADT path from a search result (e.g. /sap/bc/adt/oo/classes/cl_x) — read it directly. */
  uri?: string;
};

export type ReadObjectResult =
  | {
      kind: "source";
      reference: AdtObjectReference;
      content: string;
      /** adt-ls served a placeholder (classic type, not editable in VS Code). */
      unsupported: boolean;
    }
  | { kind: "ambiguous"; candidates: AdtObjectReference[] };

export type SearchInput = {
  destination: string;
  pattern: string;
  types?: string[];
  maxResults?: number;
};

/** Read ABAP objects over some transport (LSP directly, or HTTP to the daemon). */
export interface ReadObjectBackend {
  readObject(input: ReadObjectInput): Promise<ReadObjectResult>;
  search(input: SearchInput): Promise<AdtObjectReference[]>;
}

/** `ReadObjectBackend` backed directly by an `adt-lsc` LSP connection. */
export class LspReadBackend implements ReadObjectBackend {
  constructor(
    private readonly req: LspRequester,
    private readonly retry: RetryOptions = {},
  ) {}

  private async resolve(request: {
    destination: string;
    pattern: string;
    types?: string[];
    maxResults?: number;
  }): Promise<AdtObjectReference[]> {
    const result = await retryUntilNonEmpty(
      () => quickSearch(this.req, request),
      (r) => (r.references?.length ?? 0) === 0,
      `quickSearch '${request.pattern}'`,
      this.retry,
    );
    return result.references ?? [];
  }

  async readObject(input: ReadObjectInput): Promise<ReadObjectResult> {
    // Precise path: an ADT uri from a search result — no name resolution / no
    // type-vocabulary needed (search→read composes on the uri).
    let ref: AdtObjectReference;
    if (input.uri) {
      ref = {
        name: input.objectName ?? lastUriSegment(input.uri),
        uri: input.uri,
      };
    } else {
      if (!input.objectName) {
        throw new Error("readObject requires objectName or uri");
      }
      // objectType is an ADT type code (CLAS/OC) — adt-ls's quickSearch `types`
      // filter expects codes, not the display label it returns ("Class").
      const refs = await this.resolve({
        destination: input.destination,
        pattern: input.objectName,
        types: input.objectType ? [input.objectType] : undefined,
      });
      const picked = pickReference(refs, { name: input.objectName });
      if ("candidates" in picked) {
        return { kind: "ambiguous", candidates: picked.candidates };
      }
      ref = picked.match;
    }
    if (!ref.uri) {
      throw new Error(`Object ${ref.name} has no ADT uri to resolve`);
    }
    const lsUri = await getLsUri(this.req, {
      destination: input.destination,
      adtUri: ref.uri,
    });
    const content = await retryUntilNonEmpty(
      () => readFile(this.req, lsUri),
      (c) => c.length === 0,
      `readFile ${ref.name}`,
      this.retry,
    );
    return {
      kind: "source",
      reference: ref,
      content,
      unsupported: isUnsupportedPlaceholder(content),
    };
  }

  async search(input: SearchInput): Promise<AdtObjectReference[]> {
    return this.resolve({
      destination: input.destination,
      pattern: input.pattern,
      types: input.types,
      maxResults: input.maxResults,
    });
  }
}

/**
 * `ReadObjectBackend` that forwards to a daemon's read endpoint over HTTP.
 * Used by the stdio bridge in shared mode, where the LSP connection lives in a
 * separate daemon process (see docs/plans/2026-06-07-mcp-read-abap-object.md).
 * The daemon owns the retry/timeout logic; this client just waits for it.
 */
export class HttpReadBackend implements ReadObjectBackend {
  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly timeoutMs = 60_000,
  ) {}

  private async post<T>(path: string, body: object): Promise<T> {
    const res = await fetch(`${this.url}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    let data: (T & { error?: string }) | undefined;
    try {
      data = (await res.json()) as T & { error?: string };
    } catch {
      // 2xx with non-JSON body is still a protocol violation — surface it
      // instead of returning `undefined` and silently violating the return
      // type contract.
      throw new Error(
        `read endpoint returned invalid JSON (HTTP ${res.status})`,
      );
    }
    if (!res.ok) {
      const msg = data?.error ?? `read endpoint HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data as T;
  }

  readObject(input: ReadObjectInput): Promise<ReadObjectResult> {
    return this.post<ReadObjectResult>("/read-object", input);
  }

  async search(input: SearchInput): Promise<AdtObjectReference[]> {
    const r = await this.post<{ references?: AdtObjectReference[] }>(
      "/search",
      input,
    );
    return r.references ?? [];
  }
}

/**
 * Best-effort warm-up of the RIS index for a destination, so the first real
 * `quickSearch` after logon doesn't return an empty (cold) result. Errors and
 * empty results are ignored — this only primes the backend.
 */
export async function prewarm(
  req: LspRequester,
  request: { destination: string },
): Promise<void> {
  try {
    await quickSearch(req, {
      destination: request.destination,
      pattern: "*",
      maxResults: 1,
    });
  } catch {
    /* best effort */
  }
}
