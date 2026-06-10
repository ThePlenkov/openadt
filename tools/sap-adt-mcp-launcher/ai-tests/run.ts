#!/usr/bin/env bun
/**
 * MCP AI scenario runner — live SAP, destination supplied by user/agent.
 * Spec: specs/mcp-ai-testing.md
 */
import { parseCli } from "./framework/context";
import { runAiTests } from "./framework/runner";

const { exitCode } = await runAiTests(parseCli(process.argv.slice(2)));
process.exit(exitCode);
