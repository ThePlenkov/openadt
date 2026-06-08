# MCP shared backend (auto-ensure + attach)

OpenADT auto-ensures an MCP HTTP backend so multiple stdio agents attach without manual `mcp serve`. One `adt-lsc` per workspace serves all agents.

---

## Scope

- **Multi-agent stdio:** multiple agents share one `adt-lsc` + one HTTP MCP endpoint.
- **No manual `mcp serve`:** agents spawn `serve --stdio` and automatically attach to a healthy shared backend.
- **One `adt-lsc` per workspace:** avoids port conflicts and redundant SAP logon sessions.

---

## Modes

| Mode         | CLI                          | Description                                               |
| ------------ | ---------------------------- | --------------------------------------------------------- |
| `shared`     | `serve --stdio` (default)    | Ensure backend + attach stdio bridge; do NOT kill on exit |
| `standalone` | `serve --stdio --standalone` | Own `adt-lsc`, kill on exit (legacy monolithic path)      |
| `daemon`     | `serve` (HTTP-only)          | Detached HTTP backend for external HTTP MCP clients       |
| `bridge`     | `bridge --stdio`             | Attach-only to existing backend; fail if none healthy     |

---

## Ensure algorithm

1. **Find healthy endpoint** — scan endpoint store, probe HTTP, return one that responds.
2. **If none exists:**
   - Acquire **exclusive lock** (`~/.openadt/mcp/ensure-<port>.lock`).
   - Double-check after acquire (cold-start race).
   - **Spawn detached `serve`** (not `--stdio`): `detached: true`, `stdio: "ignore"`, `unref()`.
   - **Poll for healthy:** probe HTTP MCP every 500ms until ready or timeout (360s for SAP logon).
3. **Attach stdio bridge** — forward stdin/stdout to HTTP endpoint.
4. **Bridge shutdown** — stdin close / SIGTERM → exit bridge only; do **NOT** call `stopMcpServer` or kill `adt-lsc`.

---

## Healthy endpoint

Three-way probe:

1. `readEndpoint(port)` — file exists and parses.
2. `isProcessAlive(pid)` — process is running (ESRCH = dead).
3. `probeMcpHttp(port, token)` — HTTP POST returns 200 or 401 (Bearer valid).

---

## Port selection

| Source             | Port                                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| Default            | `2236`                                                                                                   |
| Override           | `--port` / `OPENADT_MCP_PORT`                                                                            |
| **Auto-increment** | If port busy (TCP bind fail or LSP `port-in-use` error): try N+1, then N+2, up to 65535, max 32 attempts |

---

## Attach resolution

- **Exactly one** healthy endpoint in store → attach to it (ignore preferred port).
- **More than one** → exit `5` + message: run `mcp list` to disambiguate.
- **None** → ensure algorithm (spawn new daemon).

---

## Daemon spawn

### Launcher resolution (`resolveDetachedSpawn`)

`spawnDetachedServeInternal` calls `resolveDetachedSpawn(launcherPath?, { compiled? })` to
pick the spawn command and argv for the detached HTTP daemon. The resolver
returns `{ command, args }` where `args` always includes the `"serve"` subcommand
(`["serve", ...]` for executable launches; `[scriptPath, "serve", ...]` for
`bun <script>` launches).

**Priority order** (first match wins):

| #   | Condition (from `process.execPath`, `OPENADT_MCP_LAUNCHER`, or argv) | Result                                                                                            |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | `OPENADT_MCP_LAUNCHER` set (test override)                           | See launcher-path table below                                                                     |
| 2   | **Running as a compiled Bun binary** (`Bun.isCompiled === true`)     | `{ command: process.execPath, args: ["serve", "--port", …] }` (re-exec self — no Bun script path) |
| 3   | `dist/main.mjs` or `dist/main.js` exists beside `src/`               | `bun <dist> serve --port …`                                                                       |
| 4   | `src/main.ts` (or `here/main.ts`) exists (dev clone)                 | `bun <main.ts> serve --port …`                                                                    |
| 5   | None of the above (packaged binary with `dist/` or `src/` missing)   | `process.execPath` + serve args (same as #2 — re-exec self)                                       |

**Launcher-path override** (`OPENADT_MCP_LAUNCHER` or `options.launcherPath`):

| Suffix of value            | Resolver emits                           |
| -------------------------- | ---------------------------------------- |
| `.ts`, `.mjs`, `.js`       | `bun <path> serve --port …`              |
| anything else (executable) | `<path> serve --port …` (no Bun wrapper) |

This is what makes the **Scoop-installed `openadt-mcp.exe`** work: the binary
embeds the Bun runtime (no `bun` on `PATH`), so the resolver must re-exec
`process.execPath` with the `serve` subcommand and **not** try to invoke
`bun main.ts` from a non-existent on-disk script.

The compiled-binary check (`Bun.isCompiled`) is preferred over disk probing
because a packaged `openadt-mcp.exe` may run from any cwd (including one that
happens to contain a stale `dist/` or `src/main.ts` from a checkout, or a
user-space project). Disk probes (steps 3–4) are only safe in the
**uncompiled** dev/clone path.

### Spawn call

```typescript
const { command, args } = resolveDetachedSpawn(options.launcherPath);
const child = spawn(command, [...args, "--foreground", ...serveArgs], {
  detached: true,
  stdio: "ignore",
  cwd: process.cwd(),
  env: runtimeEnv,
});
// Unref the CHILD (not the parent) so the bridge process can exit without
// waiting for the daemon. `process.unref()` here would do nothing useful.
child.unref();
```

### Health-check timeout ⇒ kill child

When the lock-held `spawnAndAwaitHealthy` block throws
`OPENADT_MCP_TIMEOUT` (no healthy endpoint within `timeoutMs`), the spawned
child is terminated before the error propagates. This prevents zombie
detached processes that bind a TCP port and never register an endpoint.

```typescript
try {
  const healthy = await waitForHealthyRecord({ port, timeoutMs });
  if (!healthy) throw new OpenadtMcpTimeoutError(port, timeoutMs);
  return attachToRecord(healthy);
} catch (err) {
  if (isOwnChild(child) && child.exitCode === null) {
    killChildTree(child); // SIGTERM then SIGKILL after grace period
  }
  throw err;
}
```

`child.kill()` is **not** enough on Windows; the launcher uses
`taskkill /pid <pid> /T /F` to reap the whole tree.

---

## Lock

| Item      | Value                                                 |
| --------- | ----------------------------------------------------- |
| File      | `~/.openadt/mcp/ensure-<port>.lock`                   |
| Create    | `fs.mkdirSync(dir, { recursive: true, mode: 0o700 })` |
| Exclusive | `open(path, flags: "wx")` — fail if exists            |
| Waiter    | Poll endpoint store every 500ms until lock released   |
| Timeout   | 360s (SAP logon)                                      |
| Cleanup   | `fs.rmSync(lockFile)` on success or timeout           |

---

## Bridge shutdown

When stdin closes or SIGTERM received:

1. Stop forwarding new stdin messages.
2. Drain in-flight HTTP forwards.
3. **Exit bridge only** — do NOT call `stopMcpServer`, do NOT kill `adt-lsc`.

---

## Backend shutdown

`openadt mcp stop [--port]` — calls `stopTrackedMcpServers({ onlyPort })`. Exit `0` if stopped or already dead.

Idle timeout is out of scope for MVP.

---

## Cold-start race

```
Thread A: lock acquire → succeeds
Thread B: lock acquire → fails → waits
Thread A: double-check (endpoint exists now?) → spawn if not
Thread A: write endpoint, release lock
Thread B: wake → find healthy endpoint → attach
```

---

## Failure modes

| Condition                 | Client-visible behavior                      | Exit code |
| ------------------------- | -------------------------------------------- | --------- |
| Extension missing         | JSON-RPC error; exit `1`                     | 1         |
| Logon timeout             | JSON-RPC error; stderr explains Secure Login | 1         |
| Port in use               | stderr message; exit `4`                     | 4         |
| Multiple active endpoints | stderr + mcp list message; exit `5`          | 5         |
| Ensure lock timeout       | stderr; exit `6`                             | 6         |
| Daemon spawn failed       | stderr; exit `7`                             | 7         |
| HTTP never ready          | JSON-RPC error on queued requests; exit `3`  | 3         |

---

## Agent config

```json
{
  "mcpServers": {
    "sap-adt": {
      "command": "bun",
      "args": ["run", "mcp:stdio"]
    }
  }
}
```

`mcp:stdio` entry switches to shared mode automatically. Do NOT set `--standalone` in agent config.

---

## Security

- Bearer tokens in endpoint store mode `0600`.
- Redact `Authorization` in debug logs.
- Tests: fictional fixtures (`DEV`, `dev-ms.example.com`, fake UUIDs).

---

## CLI surface

| Command / flag                   | Behavior                                                        |
| -------------------------------- | --------------------------------------------------------------- |
| `mcp serve --stdio`              | Shared (ensure + bridge) — **new default**                      |
| `mcp serve --stdio --standalone` | Current monolithic path (owns `adt-lsc`, kills on exit)         |
| `mcp serve`                      | HTTP-only daemon (unchanged; used as detached child)            |
| `mcp stop [--port]`              | `stopTrackedMcpServers({ onlyPort })`; exit `0` if stopped/dead |
| `mcp bridge --stdio [--port]`    | Attach-only; fail if no healthy backend (tests / low-level)     |

---

## Implementation map

| Component         | Path                                                                         |
| ----------------- | ---------------------------------------------------------------------------- |
| CLI entry         | `apps/openadt-cli` → `McpServeCommand` → Bun launcher                        |
| Launcher          | `tools/sap-adt-mcp-launcher/src/main.ts`                                     |
| **Ensure module** | `tools/sap-adt-mcp-launcher/src/ensure-backend.ts` (new)                     |
| Stdio bridge      | `tools/sap-adt-mcp-launcher/src/stdio-proxy.ts`                              |
| Stdio agent entry | `scripts/mcp-stdio.ts` → `tools/sap-adt-mcp-launcher/src/mcp-stdio-entry.ts` |
| Endpoint store    | `tools/sap-adt-mcp-launcher/src/endpoint-store.ts`                           |
| Config parsing    | `tools/sap-adt-mcp-launcher/src/config.ts`                                   |

---

## Out of scope (MVP)

- Idle auto-shutdown of backend.
- HTTP `url` in agent config (alternative to stdio bridge).
- Bridge process refcount.
- `--attach` alias (use `bridge` + ensure).
