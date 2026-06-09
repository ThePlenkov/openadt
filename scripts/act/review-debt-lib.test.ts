import { describe, expect, test } from "bun:test";
import {
  bodyPreview,
  deriveArea,
  fingerprint,
  normalizeBody,
  upsertRecords,
  type DebtRecord,
} from "./review-debt-lib.ts";

describe("review-debt-lib", () => {
  test("fingerprint is stable for normalized body", () => {
    const a = fingerprint("Consider  extracting", "apps/foo/Bar.java");
    const b = fingerprint("consider extracting", "apps/foo/Bar.java");
    expect(a).toBe(b);
  });

  test("deriveArea uses first two segments", () => {
    expect(deriveArea("apps/openadt-cli/src/Foo.java")).toBe(
      "apps/openadt-cli",
    );
    expect(deriveArea("README.md")).toBe("README.md");
  });

  test("bodyPreview truncates long text", () => {
    const long = "x".repeat(200);
    expect(bodyPreview(long).length).toBeLessThanOrEqual(120);
  });

  test("normalizeBody collapses whitespace", () => {
    expect(normalizeBody("  Hello   World  ")).toBe("hello world");
  });

  test("upsertRecords increments times_seen", () => {
    const base: DebtRecord = {
      thread_id: "PRRT_1",
      thread_url: "https://example.com#1",
      status: "open",
      priority: "nit",
      needs: "code_change",
      source_pr: 1,
      source_pr_url: "https://example.com/pull/1",
      source_pr_title: "t",
      merged_at: "2026-01-01T00:00:00Z",
      merged_sha: "abc",
      path: "a/b",
      line: 1,
      author: "bot",
      body: "fix",
      body_preview: "fix",
      fingerprint: "sha256:1",
      area: "a",
      harvested_at: "2026-01-01T00:00:00Z",
      harvest_run_id: "r1",
      times_seen: 1,
      fix_pr: null,
      fixed_at: null,
      notes: null,
    };
    const incoming = { ...base, harvested_at: "2026-02-01T00:00:00Z" };
    const merged = upsertRecords([base], [incoming]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.times_seen).toBe(2);
  });
});
