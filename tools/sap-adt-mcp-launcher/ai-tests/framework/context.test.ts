import { describe, expect, test } from "bun:test";
import {
  getCliFlag,
  parseCli,
  resolveAcpAgent,
  resolveE2eExecutor,
} from "./context";

describe("getCliFlag", () => {
  test("reads --flag value form", () => {
    expect(getCliFlag(["--destination", "ABC_100_USER_EN"], "--destination")).toBe(
      "ABC_100_USER_EN",
    );
  });

  test("reads --flag=value form", () => {
    expect(getCliFlag(["--command=acp", "mcp-1"], "--command")).toBe("acp");
  });

  test("returns undefined when flag missing", () => {
    expect(getCliFlag(["mcp-1"], "--command")).toBeUndefined();
  });
});

describe("resolveE2eExecutor", () => {
  test("defaults to local", () => {
    expect(resolveE2eExecutor(["mcp-1", "--destination", "X"])).toBe("local");
  });

  test("accepts --command=acp", () => {
    expect(resolveE2eExecutor(["mcp-1", "--command=acp"])).toBe("acp");
  });

  test("accepts --command acp", () => {
    expect(resolveE2eExecutor(["mcp-1", "--command", "acp"])).toBe("acp");
  });

  test("accepts --executor acp", () => {
    expect(resolveE2eExecutor(["--executor", "acp"])).toBe("acp");
  });

  test("accepts --acp boolean alias", () => {
    expect(resolveE2eExecutor(["mcp-2", "--acp"])).toBe("acp");
  });

  test("maps cursor alias to local", () => {
    expect(resolveE2eExecutor(["--command", "cursor"])).toBe("local");
  });

  test("rejects unknown executor", () => {
    expect(() => resolveE2eExecutor(["--command", "codex"])).toThrow(/Unknown executor/);
  });
});

describe("resolveAcpAgent", () => {
  test("requires --agent or ACP_AGENT", () => {
    expect(() =>
      resolveAcpAgent({
        resolveDestination: false,
        importFrom: "adtls",
        port: 2239,
        timeoutMs: 300_000,
        list: false,
        evidence: false,
        executor: "acp",
      }),
    ).toThrow(/requires --agent/);
  });

  test("reads --agent flag", () => {
    expect(
      resolveAcpAgent({
        agent: "devin",
        resolveDestination: false,
        importFrom: "adtls",
        port: 2239,
        timeoutMs: 300_000,
        list: false,
        evidence: false,
        executor: "acp",
      }),
    ).toBe("devin");
  });
});

describe("parseCli executor", () => {
  test("includes executor from argv", () => {
    const opts = parseCli([
      "mcp-1",
      "--acp",
      "--agent",
      "cursor",
      "--destination",
      "ABC_100_USER_EN",
    ]);
    expect(opts.executor).toBe("acp");
    expect(opts.scenario).toBe("mcp-1");
    expect(opts.destination).toBe("ABC_100_USER_EN");
    expect(opts.agent).toBe("cursor");
  });
});
