#!/usr/bin/env bun
/**
 * External E2E dispatch — write .e2e/dispatch/<run-id>.json and print ACP handoff instructions.
 * Usage: bun run e2e:dispatch -- mcp-1 --destination ABC_200_USER_EN --acp --agent devin
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCli } from "../tools/sap-adt-mcp-launcher/ai-tests/framework/context";
import { runE2eDispatch } from "../tools/sap-adt-mcp-launcher/ai-tests/framework/dispatch";
import { resolveRepoRoot } from "../tools/sap-adt-mcp-launcher/ai-tests/framework/evidence";

const repoRoot = resolveRepoRoot(dirname(fileURLToPath(import.meta.url)));
const { exitCode } = runE2eDispatch(parseCli(process.argv.slice(2)), repoRoot);
process.exit(exitCode);
