import { describe, expect, test } from "bun:test";
import {
  DEFAULT_MAX_MCP_TOOL_NAME_LEN,
  MAX_MCP_TOOL_NAME_LEN_CEILING,
  maxMcpToolNameLenFromEnv,
  MIN_REGISTRY_MAX_LEN,
  rewriteToolsCallRequest,
  shortenToolsInListResponse,
  ToolNameRegistry,
} from "./tool-name-limit.ts";

describe("ToolNameRegistry", () => {
  test("passes through short names", () => {
    const registry = new ToolNameRegistry(45);
    expect(registry.exportName("abap_transport-get")).toBe(
      "abap_transport-get",
    );
    expect(registry.importName("abap_transport-get")).toBe(
      "abap_transport-get",
    );
  });

  test("shortens long names deterministically", () => {
    const registry = new ToolNameRegistry(45);
    const long = "abap_business_services-fetch_service_information";
    const alias = registry.exportName(long);
    expect(alias.length).toBeLessThanOrEqual(45);
    expect(alias).toMatch(/_x[0-9a-f]{6}$/);
    expect(registry.exportName(long)).toBe(alias);
    expect(registry.importName(alias)).toBe(long);
  });

  test("clamps maxLen below MIN_REGISTRY_MAX_LEN so the suffix fits", () => {
    const registry = new ToolNameRegistry(2);
    const long = "abap_business_services-fetch_service_information";
    const alias = registry.exportName(long);
    expect(alias).toMatch(/_x[0-9a-f]{6}$/);
    expect(registry.importName(alias)).toBe(long);
    expect(new ToolNameRegistry(0).exportName(long)).toBe(
      new ToolNameRegistry(MIN_REGISTRY_MAX_LEN).exportName(long),
    );
  });
});

describe("shortenToolsInListResponse", () => {
  test("rewrites tools/list names", () => {
    const registry = new ToolNameRegistry(45);
    const long = "abap_business_services-fetch_service_information";
    const body = JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      result: {
        tools: [{ name: long }, { name: "abap_transport-get" }],
      },
    });
    const out = shortenToolsInListResponse({
      body,
      reqId: 2,
      method: "tools/list",
      registry,
    });
    const parsed = JSON.parse(out) as {
      result: { tools: Array<{ name: string }> };
    };
    expect(parsed.result.tools[0].name.length).toBeLessThanOrEqual(45);
    expect(parsed.result.tools[1].name).toBe("abap_transport-get");
  });

  test("ignores non tools/list responses", () => {
    const registry = new ToolNameRegistry(45);
    const body = '{"jsonrpc":"2.0","id":1,"result":{}}';
    expect(
      shortenToolsInListResponse({
        body,
        reqId: 1,
        method: "initialize",
        registry,
      }),
    ).toBe(body);
  });
});

describe("rewriteToolsCallRequest", () => {
  test("maps alias back to SAP tool name", () => {
    const registry = new ToolNameRegistry(45);
    const long = "abap_business_services-fetch_service_information";
    const alias = registry.exportName(long);
    const body = JSON.stringify({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: alias, arguments: { binding: "ZTEST" } },
    });
    const out = rewriteToolsCallRequest({ body, registry });
    const parsed = JSON.parse(out) as {
      params: { name: string; arguments: { binding: string } };
    };
    expect(parsed.params.name).toBe(long);
    expect(parsed.params.arguments.binding).toBe("ZTEST");
  });
});

describe("maxMcpToolNameLenFromEnv", () => {
  test("defaults when unset", () => {
    expect(maxMcpToolNameLenFromEnv({})).toBe(DEFAULT_MAX_MCP_TOOL_NAME_LEN);
  });

  test("reads OPENADT_MCP_MAX_TOOL_NAME", () => {
    expect(maxMcpToolNameLenFromEnv({ OPENADT_MCP_MAX_TOOL_NAME: "52" })).toBe(
      52,
    );
  });

  test("falls back on invalid values", () => {
    expect(maxMcpToolNameLenFromEnv({ OPENADT_MCP_MAX_TOOL_NAME: "bad" })).toBe(
      DEFAULT_MAX_MCP_TOOL_NAME_LEN,
    );
  });

  test("caps values above the Bedrock/Claude budget", () => {
    expect(
      maxMcpToolNameLenFromEnv({
        OPENADT_MCP_MAX_TOOL_NAME: String(MAX_MCP_TOOL_NAME_LEN_CEILING + 1),
      }),
    ).toBe(DEFAULT_MAX_MCP_TOOL_NAME_LEN);
  });
});
