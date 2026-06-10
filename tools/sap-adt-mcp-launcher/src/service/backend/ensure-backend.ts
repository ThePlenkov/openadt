/**
 * Ensure a shared MCP HTTP backend is running.
 *
 * Multiple stdio agents share one `adt-lsc` + one HTTP MCP endpoint.
 * See specs/mcp-shared-backend.md.
 */
import { createServer, type Server } from "node:net";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  rmSync,
  statSync,
} from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";
import { homedir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { killProcessTree, sleep } from "../../infra/process.ts";
import {
  endpointFilePath,
  findHealthyEndpoint,
  type McpEndpointRecord,
} from "./endpoint-store";
import { DEFAULT_MCP_PORT } from "../../config/types.ts";
import { buildAdtLscSpawnRuntime } from "../../infra/runtime-env.ts";
import { resolveBunExecutable } from "../../infra/resolve-bun.ts";

/**
 * Plan returned by {@link resolveDetachedSpawn}.
 *
 * `args` starts with `"serve"` when the chosen command is a direct executable
 * (compiled binary, env-override executable), and with the script path
 * followed by `"serve"` when the launcher is run via `bun <script>`:
 *
 *   - `{ command: process.execPath, args: ["serve", ...] }`  — packaged binary
 *   - `{ command: "bun", args: ["/abs/main.ts", "serve", ...] }`  — dev/dist
 */
export type DetachedSpawnPlan = {
  command: string;
  args: string[];
};

/** True when the current process is a compiled Bun binary (e.g. `openadt-mcp.exe`). */
function isCompiledBinary(): boolean {
  // Bun.isCompiled is only present at runtime in compiled builds. Treat its
  // absence as "not compiled" so the dev path is the default.
  const flag = (globalThis as { Bun?: { isCompiled?: boolean } }).Bun
    ?.isCompiled;
  return flag === true;
}

/** True when `path` looks like a Bun script we should run via `bun <path>`. */
function isBunScriptPath(path: string): boolean {
  const ext = extname(path).toLowerCase();
  return ext === ".ts" || ext === ".mjs" || ext === ".js";
}

/** Treat the parent as the dist/ or src/ launcher if its script lives on disk. */
function resolveBundleLauncher(): string | undefined {
  const srcRoot = resolve(here, "..", "..");
  const distMjs = resolve(srcRoot, "..", "dist", "main.mjs");
  if (existsSync(distMjs)) return distMjs;
  const distJs = resolve(srcRoot, "..", "dist", "main.js");
  if (existsSync(distJs)) return distJs;
  const mainTs = resolve(srcRoot, "main.ts");
  if (existsSync(mainTs)) return mainTs;
  const cliMainTs = resolve(srcRoot, "cli", "main.ts");
  if (existsSync(cliMainTs)) return cliMainTs;
  return undefined;
}

/**
 * Pick the spawn command + args for the detached HTTP daemon.
 *
 * Resolution order (see `specs/mcp-shared-backend.md` § Launcher resolution):
 *  1. `launcherPath` (test / `OPENADT_MCP_LAUNCHER`): `.ts|.mjs|.js` → `bun`+path;
 *     otherwise treat as executable.
 *  2. Compiled Bun binary (`Bun.isCompiled === true`, or `compiled` test flag)
 *     → `process.execPath` + serve.
 *  3. `dist/main.{mjs,js}` or `src/main.ts` exists → `bun` + script + serve.
 *  4. Fallback (packaged binary without `dist/` or `src/` on disk) →
 *     `process.execPath` + serve.
 *
 * `options.compiled` is a test seam that overrides the `Bun.isCompiled` check
 * so unit tests can exercise the packaged-binary branch without depending on
 * the host's runtime state.
 */
export function resolveDetachedSpawn(
  launcherPath?: string,
  options: { compiled?: boolean } = {},
): DetachedSpawnPlan {
  const explicit = launcherPath ?? process.env.OPENADT_MCP_LAUNCHER;
  if (explicit && explicit.length > 0) {
    if (isBunScriptPath(explicit)) {
      return { command: resolveBunExecutable(), args: [explicit, "serve"] };
    }
    return { command: explicit, args: ["serve"] };
  }
  if (options.compiled === true || isCompiledBinary()) {
    return { command: process.execPath, args: ["serve"] };
  }
  const bundled = resolveBundleLauncher();
  if (bundled) {
    return { command: resolveBunExecutable(), args: [bundled, "serve"] };
  }
  return { command: process.execPath, args: ["serve"] };
}

const PORT_MIN = 1024;
const PORT_MAX = 65535;
const DEFAULT_LOCK_TIMEOUT_MS = 360_000;
const LOCK_POLL_INTERVAL_MS = 500;
const HEALTHY_PROBE_INTERVAL_MS = 250;

const here = dirname(fileURLToPath(import.meta.url));

export type EnsureSharedBackendOptions = {
  preferredPort?: number;
  /** Forwarded to the spawned daemon. */
  serveArgs?: string[];
  /** Max time to wait for the lock and for a healthy endpoint. */
  timeoutMs?: number;
  /** Custom mcp root dir (for tests). */
  mcpRootDir?: string;
  /** Custom launcher path (for tests). */
  launcherPath?: string;
};

export type EnsureSharedBackendResult = {
  port: number;
  token: string;
  url: string;
  record: McpEndpointRecord;
};

/** Result of attaching to an existing healthy endpoint (no spawn). */
export type AttachResolution =
  | { kind: "none" }
  | { kind: "ambiguous"; records: McpEndpointRecord[] }
  | { kind: "healthy"; record: McpEndpointRecord };

export function mcpRootDir(): string {
  return process.env.OPENADT_MCP_DIR ?? join(homedir(), ".openadt", "mcp");
}

export function ensureLockPath(port: number): string {
  return join(mcpRootDir(), `ensure-${port}.lock`);
}

export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= PORT_MIN && port <= PORT_MAX;
}

/**
 * Find an available TCP port by trying sequential binds from `start`.
 * Returns the first port that binds successfully.
 */
export function findAvailablePort(start: number): Promise<number> {
  return new Promise((resolvePort, reject) => {
    let port = Math.max(start, PORT_MIN);
    const tryNext = (): void => {
      if (port > PORT_MAX) {
        reject(new Error(`No available port starting from ${start}`));
        return;
      }
      const server: Server = createServer();
      server.unref();
      server.on("error", () => {
        port++;
        tryNext();
      });
      server.listen(port, "127.0.0.1", () => {
        const address = server.address();
        const boundPort =
          address && typeof address !== "string" ? address.port : port;
        server.close((err) => {
          if (err) {
            port = boundPort + 1;
            tryNext();
            return;
          }
          resolvePort(boundPort);
        });
      });
    };
    tryNext();
  });
}

async function withEnsureLock<T>(
  port: number,
  fn: () => Promise<T>,
  options: { timeoutMs?: number; mcpRootDir?: string } = {},
): Promise<T> {
  const lock = new EnsureLock({
    root: options.mcpRootDir ?? mcpRootDir(),
    port,
    timeoutMs: options.timeoutMs ?? DEFAULT_LOCK_TIMEOUT_MS,
  });
  await lock.acquire();

  try {
    return await fn();
  } finally {
    lock.release();
  }
}

/** Coordinate an `ensure-<port>.lock` file for one ensure attempt. */
class EnsureLock {
  readonly lockPath: string;
  private readonly deadline: number;

  constructor(request: { root: string; port: number; timeoutMs: number }) {
    this.lockPath = join(request.root, `ensure-${request.port}.lock`);
    this.deadline = Date.now() + request.timeoutMs;
    mkdirSync(request.root, { recursive: true, mode: 0o700 });
  }

  async acquire(): Promise<void> {
    while (Date.now() < this.deadline) {
      if (this.tryClaim()) {
        return;
      }
      await this.waitOrReapStale();
    }
    throw new Error(
      `Timed out waiting for ensure lock (lock: ${this.lockPath})`,
    );
  }

  release(): void {
    try {
      rmSync(this.lockPath);
    } catch {
      /* already removed */
    }
  }

  private tryClaim(): boolean {
    try {
      // O_EXCL: fail if file exists. Close immediately — the lock is the
      // file's presence (rmSync in release, stale-check via mtime).
      closeSync(openSync(this.lockPath, "wx", 0o600));
      return true;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException | undefined)?.code;
      if (code !== "EEXIST") {
        throw new Error(
          `Failed to create lock ${this.lockPath}: ${formatError(err)}`,
        );
      }
      return false;
    }
  }

  private async waitOrReapStale(): Promise<void> {
    if (this.isStale()) {
      try {
        rmSync(this.lockPath);
      } catch {
        /* race: another process cleared it */
      }
      return;
    }
    await sleep(LOCK_POLL_INTERVAL_MS);
  }

  private isStale(): boolean {
    // Lock is considered stale if the file is older than 2x the SAP logon timeout.
    try {
      const stat = statSync(this.lockPath);
      const ageMs = Date.now() - stat.mtimeMs;
      return ageMs > DEFAULT_LOCK_TIMEOUT_MS * 2;
    } catch {
      return false;
    }
  }
}

function formatError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Path to the stderr log file for a detached daemon on the given port. */
export function daemonLogFilePath(port: number): string {
  return join(homedir(), ".openadt", "logs", `mcp-daemon-${port}.log`);
}

/**
 * Spawn the launcher in detached mode (HTTP-only daemon).
 * The child is not a child of the bridge process — it survives parent exit.
 */
export function spawnDetachedServe(
  port: number,
  serveArgs: string[],
  options: { launcherPath?: string; extraEnv?: NodeJS.ProcessEnv } = {},
): ChildProcess {
  return spawnDetachedServeInternal({ port, serveArgs, options });
}

function spawnDetachedServeInternal(request: {
  port: number;
  serveArgs: string[];
  options: { launcherPath?: string; extraEnv?: NodeJS.ProcessEnv };
}): ChildProcess {
  const plan = resolveDetachedSpawn(request.options.launcherPath);
  const runtime = buildAdtLscSpawnRuntime();
  const args = [
    ...plan.args,
    "--port",
    String(request.port),
    ...request.serveArgs,
  ];

  // Redirect daemon stderr to a log file so startup failures are diagnosable.
  // Falls back to "ignore" if the log file cannot be opened.
  const logPath = daemonLogFilePath(request.port);
  let stderrFd: number | "ignore" = "ignore";
  try {
    mkdirSync(dirname(logPath), { recursive: true });
    stderrFd = openSync(logPath, "a");
  } catch {
    /* non-critical: proceed without capture */
  }

  let child: ChildProcess | undefined;
  try {
    child = spawn(plan.command, args, {
      cwd: process.cwd(),
      stdio: ["ignore", "ignore", stderrFd],
      env: {
        ...runtime.env,
        ...(request.options.extraEnv ?? {}),
      },
      detached: true,
      windowsHide: true,
    });
  } finally {
    // Parent closes its copy; child has inherited the fd and can write independently.
    if (typeof stderrFd === "number") {
      closeSync(stderrFd);
    }
  }

  if (!child) {
    // spawn() threw synchronously and left child unassigned.
    throw new Error("Failed to spawn MCP daemon");
  }
  child.unref();
  return child;
}

/**
 * Poll the endpoint store for a healthy record on `port`.
 * Returns the record once it responds to HTTP probe, or undefined on timeout.
 */
async function waitForHealthyRecord(request: {
  port: number;
  timeoutMs: number;
}): Promise<McpEndpointRecord | undefined> {
  const deadline = Date.now() + request.timeoutMs;
  while (Date.now() < deadline) {
    const found = await probeHealthyRecord(request.port);
    if (found) return found;
    await sleep(HEALTHY_PROBE_INTERVAL_MS);
  }
  return undefined;
}

async function probeHealthyRecord(
  port: number,
): Promise<McpEndpointRecord | undefined> {
  const result = await findHealthyEndpoint(port);
  if (result.status === "one") {
    return result.record;
  }
  if (result.status === "ambiguous") {
    // Multiple records (different pids) — wait for one to die or for our
    // own record to appear. Prefer the matching port.
    return result.records.find((r) => r.port === port);
  }
  return undefined;
}

/**
 * Resolve the attach target: an existing healthy endpoint if one exists.
 * Used by `ensureSharedBackend` before deciding to spawn a new daemon.
 */
export async function resolveAttachTarget(
  preferredPort?: number,
): Promise<AttachResolution> {
  const result = await findHealthyEndpoint(preferredPort);
  if (result.status === "one") {
    return { kind: "healthy", record: result.record };
  }
  if (result.status === "ambiguous") {
    return { kind: "ambiguous", records: result.records };
  }
  if (result.status === "none") {
    return { kind: "none" };
  }
  // unhealthy: records exist but none respond → fall through to ensure.
  return { kind: "none" };
}

/**
 * Ensure a shared MCP backend is running. Returns the record to attach to.
 *
 * Algorithm (see specs/mcp-shared-backend.md §Ensure):
 * 1. Find healthy endpoint → attach.
 * 2. Else acquire lock, double-check, spawn detached daemon, wait for healthy.
 * 3. Return record.
 */
export async function ensureSharedBackend(
  options: EnsureSharedBackendOptions = {},
): Promise<EnsureSharedBackendResult> {
  // Attach scope: when undefined, resolve against the whole store (attach to
  // the single healthy endpoint regardless of port). Spawn port: the port a
  // brand-new daemon should bind when no healthy backend exists.
  const attachPort = options.preferredPort;
  const spawnPort = options.preferredPort ?? DEFAULT_MCP_PORT;
  const timeoutMs = options.timeoutMs ?? DEFAULT_LOCK_TIMEOUT_MS;

  if (attachPort !== undefined && !isValidPort(attachPort)) {
    throw new Error(
      `Invalid port: ${attachPort} (must be ${PORT_MIN}-${PORT_MAX})`,
    );
  }

  // Step 1: try to attach to an existing healthy endpoint.
  const attach = await resolveAttachTarget(attachPort);
  if (attach.kind === "healthy") {
    return attachToRecord(attach.record);
  }
  if (attach.kind === "ambiguous") {
    throwAmbiguousError(
      attach.records,
      "Run: openadt mcp list. Cannot auto-attach.",
    );
  }

  // Step 2: ensure via lock + spawn.
  return withEnsureLock(
    spawnPort,
    async () => {
      // Double-check: another process may have ensured while we waited.
      const recheck = await resolveAttachTarget(attachPort);
      if (recheck.kind === "healthy") {
        return attachToRecord(recheck.record);
      }
      if (recheck.kind === "ambiguous") {
        throwAmbiguousError(recheck.records, "Run: openadt mcp list.");
      }
      return spawnAndAwaitHealthy({
        spawnPort,
        timeoutMs,
        serveArgs: options.serveArgs ?? [],
        launcherPath: options.launcherPath,
      });
    },
    { timeoutMs, mcpRootDir: options.mcpRootDir },
  );
}

function attachToRecord(record: McpEndpointRecord): EnsureSharedBackendResult {
  return {
    port: record.port,
    token: record.token,
    url: record.url,
    record,
  };
}

function throwAmbiguousError(
  records: McpEndpointRecord[],
  suffix: string,
): never {
  const ports = records.map((r) => String(r.port)).join(", ");
  const err = new Error(
    `Multiple active MCP endpoints (ports ${ports}). ${suffix}`,
  );
  (err as NodeJS.ErrnoException).code = "OPENADT_MCP_AMBIGUOUS";
  throw err;
}

async function spawnAndAwaitHealthy(input: {
  spawnPort: number;
  timeoutMs: number;
  serveArgs: string[];
  launcherPath?: string;
}): Promise<EnsureSharedBackendResult> {
  const port = await pickPortForServe(input.spawnPort);
  const child = spawnDetachedServe(port, input.serveArgs, {
    launcherPath: input.launcherPath,
  });
  if (!child.pid) {
    throw daemonError({ port, kind: "spawn-failed" });
  }
  try {
    const healthy = await waitForHealthyRecord({
      port,
      timeoutMs: input.timeoutMs,
    });
    if (!healthy) {
      throw daemonError({ port, timeoutMs: input.timeoutMs, kind: "timeout" });
    }
    // Detached daemon may have been reaped; trust the store record.
    return attachToRecord(healthy);
  } catch (err) {
    reapChildOnError(child);
    throw err;
  }
}

type DaemonErrorKind = "spawn-failed" | "timeout";

function daemonError(request: {
  port: number;
  timeoutMs?: number;
  kind: DaemonErrorKind;
}): Error {
  const message =
    request.kind === "spawn-failed"
      ? `Failed to spawn MCP daemon on port ${request.port}`
      : `MCP daemon on port ${request.port} did not become healthy within ${request.timeoutMs}ms. See daemon log: ${daemonLogFilePath(request.port)}`;
  const code =
    request.kind === "spawn-failed"
      ? "OPENADT_MCP_SPAWN_FAILED"
      : "OPENADT_MCP_TIMEOUT";
  const err = new Error(message);
  (err as NodeJS.ErrnoException).code = code;
  return err;
}

function reapChildOnError(child: ChildProcess): void {
  // Don't leave a zombie detached daemon holding the port without an
  // endpoint record. The daemon's own stdio is `ignore`, so killing the
  // parent bun process is enough.
  if (child.exitCode === null && child.signalCode === null) {
    killProcessTree(child);
  }
}

/**
 * Pick the port to use for a new daemon. If preferredPort is free, use it.
 * Otherwise auto-increment up to MAX_PORT_INCREMENT_ATTEMPTS.
 */
async function pickPortForServe(preferredPort: number): Promise<number> {
  // Quick check: does the endpoint store already have a record for this port?
  if (existsSync(endpointFilePath(preferredPort))) {
    // Endpoint exists — but we already checked findHealthyEndpoint and it
    // was unhealthy. Try the next port to avoid racing the dead daemon.
    return findAvailablePort(preferredPort + 1).catch(() => preferredPort);
  }
  return findAvailablePort(preferredPort);
}
