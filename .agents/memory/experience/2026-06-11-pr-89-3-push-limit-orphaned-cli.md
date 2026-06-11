# /act on PR #89 — stopped at 3-push limit; typecheck gate still red

## What was fixed in code (commit a761f7a)

- `tools/sap-adt-mcp-launcher/e2e/framework/dispatch.ts` `shellQuote` — escape backslashes before double quotes (CodeQL "incomplete string escaping or encoding")
- `packages/adt-mcp-tools/src/tools/update-imports.mjs` — removed duplicate `'` from 5 regex character classes (CodeQL "duplicate character in character class")
- `tools/adt-lsp-mcp/src/main.ts` `SimpleMcpServer.handleToolCall` — reject non-object tool arguments (Gemini medium)

## Replies + resolve (P1–P4)

- 46 review threads replied to and resolved (target: 50; 4 were already auto-resolved)
- 5 threads reference Java files deleted in 966c531 (AgentUri, VerbStubs, AgentThrottle, AdtAgentCommandSupport) — marked outdated
- Amazon Q "infinite recursion in resolveDestinationId" — false positive, explained in thread (the recursive call sets `destination: undefined` and `resolveDestination: true`, terminating after one call)
- Gemini "SimpleMcpServer args validation" — partially addressed in a761f7a (non-object check); full inputSchema validation deferred to a follow-up that depends on the Zod tool-factory migration
- 30+ CodeScene CC / duplication / primitive-obsession / string-heavy-args findings on new e2e-framework + adt-infra + lsp-client code — explicitly deferred to a follow-up refactor PR

## P5 scores (85 findings)

- 48 score 0 (stale / false positive / re-emitted against already-fixed code)
- 2 score 1 (trivial nits — unused vars in tests)
- 35 score 2 (valid CodeScene complexity/duplication on new foundation code, deferred)

## CI gate fixes

- `54bd970` chore: nx format:write (188 files reformatted) — pre-existing prettier-vs-biome drift between nx format:write and the precommit hook
- `b87c722` fix(ci): use biome for format:check (was `bunx nx format:check` which uses prettier) — the repo uses biome (see `package.json` `format` / `format:check` / `precommit:format`); the CI gate was running prettier which disagrees with biome on quote style, semicolons, etc.

## STOP — 3-push limit reached; typecheck still red

After 3 pushes (`a761f7a` review fixes, `54bd970` format, `b87c722` CI fix), the `lint typecheck` gate is still red on HEAD `b87c722`. The failure is **pre-existing** in the PR foundation:

- `tools/sap-adt-mcp-launcher/src/cli/main.ts` (1029 lines) is orphaned — it imports from `../service/backend/endpoint-store.ts`, `../service/backend/ensure-backend.ts`, `../service/import/gui-import.ts`, `../service/read/read-server.ts`, `../service/agent/index`, `../service/guidance/guidance`, etc. The `service/` directory was deleted by `0bf721e refactor(sap-adt-mcp-launcher): remove duplicate LSP code and unused ADT services`, but `cli/main.ts` was not cleaned up. It also has 6 implicit-`any` parameter errors.
- `tools/sap-adt-mcp-launcher/src/mcp-stdio-entry.ts` and `test-mcp-stdio.ts` import from `@openadt/adt-infra` and `@openadt/mcp-framing`, which have no type exports (their `package.json` `exports` only point to `dist/index.mjs`, no `.d.ts`, and the dist dirs don't exist). tsc fails to resolve types.
- `tools/sap-adt-mcp-launcher/src/mcp/stdio-proxy.ts` has one implicit-`any` error (line 617) plus its own dead `service/` imports.

Suggested follow-up (next /act cycle or dedicated PR): either delete the orphaned `cli/main.ts` + `test-mcp-stdio.ts`, or add `tsc --emitDeclarationOnly` to the package builds so `@openadt/adt-infra` and `@openadt/mcp-framing` ship a `dist/index.d.ts`, and configure the launcher's tsconfig to consume it.

## What I learned

- The 3-push limit is a hard wall. Once you're at the gate on a refactor PR with pre-existing CI failures, you can fix the surface failures (format, lint warnings) but you can't realistically refactor a 1000-line dead file in the same cycle. Escalate early.
- A PR titled "feat: agent foundation" can carry hundreds of unrelated file additions (350+ files in this case), and nx-affected will dutifully typecheck every affected project — including ones that import from unbuilt workspace packages. The pre-PR author likely never ran `bun run build` on the workspace packages before opening the PR.
- The orchestrator rule "leave the gate green — pre-existing is not an exemption" is correct in spirit but can trap you against a 3-push limit when the pre-existing failure is large. The escape hatch is: fix what you can in 3 pushes, then stop and escalate.
