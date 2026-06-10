import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { pipeline } from "node:stream";
import { frameMcpMessage, McpFrameDecoder } from "../../src/mcp/mcp-framing";
import type { RunContext, ScenarioMode } from "./types";

type Pending = {
  id: number;
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
};

export class McpStdioClient {
  private child: ChildProcessWithoutNullStreams;
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private ready = false;
  private readyResolve!: () => void;
  private readyPromise: Promise<void>;

  constructor(
    private launcher: string,
    private ctx: RunContext,
    private mode: ScenarioMode,
  ) {
    this.readyPromise = new Promise((resolve) => {
      this.readyResolve = resolve;
    });
    this.child = this.spawnChild();
    this.wireStdout();
  }

  private spawnChild(): ChildProcessWithoutNullStreams {
    const args = [
      "serve",
      "--stdio",
      ...(this.mode === "standalone" ? ["--standalone"] : []),
      `--import-from=${this.ctx.importFrom}`,
      "--destination",
      this.ctx.destination,
      "--port",
      String(this.ctx.port),
    ];
    return spawn("bun", [this.launcher, ...args], {
      stdio: ["pipe", "pipe", "inherit"],
      windowsHide: true,
    });
  }

  private wireStdout(): void {
    const decoder = new McpFrameDecoder();
    pipeline(this.child.stdout, decoder, () => {});
    decoder.on("data", (body: string) => this.onMessage(body));
    this.child.on("exit", (code) => {
      for (const p of this.pending.values()) {
        p.reject(new Error(`MCP exited ${code ?? 1}`));
      }
      this.pending.clear();
    });
  }

  private onMessage(body: string): void {
    let parsed: { id?: number; result?: unknown; error?: { message: string } };
    try {
      parsed = JSON.parse(body);
    } catch {
      return;
    }
    if (parsed.id === undefined) return;
    const slot = this.pending.get(parsed.id);
    if (!slot) return;
    this.pending.delete(parsed.id);
    if (parsed.error) {
      slot.reject(new Error(parsed.error.message));
    } else {
      slot.resolve(parsed.result);
    }
  }

  private send(obj: object): void {
    this.child.stdin.write(frameMcpMessage(obj));
  }

  private request(method: string, params?: unknown): Promise<unknown> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { id, resolve, reject });
      this.send({ jsonrpc: "2.0", id, method, params });
    });
  }

  async start(): Promise<void> {
    await this.request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "mcp-ai-tests", version: "0.1.0" },
    });
    this.send({ jsonrpc: "2.0", method: "notifications/initialized" });
    this.ready = true;
    this.readyResolve();
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.ready) await this.readyPromise;
    return this.request("tools/call", { name, arguments: args });
  }

  close(): void {
    if (!this.child.killed) this.child.kill();
  }
}
