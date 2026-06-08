/**
 * Patches the openadt-mcp Homebrew formula + Scoop manifest in the
 * repository checkout with the SHA256 from a built archive. Extracted
 * from mcp-package.ts to keep that file's string/primitive argument
 * surface under the CodeScene "clean_code_collective" advisory threshold.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { McpBuildContext } from "./mcp-package.ts";

const MCP_HOMEBREW_PLATFORM = "darwin-arm64";
const MCP_SCOOP_PLATFORM = "win-x64";

export function patchMcpManifests(input: PatchRequest): void {
  if (input.ctx.platform === MCP_HOMEBREW_PLATFORM) {
    patchMcpHomebrewFormula(input);
  }
  if (input.ctx.platform === MCP_SCOOP_PLATFORM) {
    patchMcpScoopManifest(input);
  }
}

type PatchRequest = {
  root: string;
  ctx: McpBuildContext;
};

function patchMcpHomebrewFormula(input: PatchRequest): void {
  const formulaPath = join(input.root, "packaging/homebrew/openadt-mcp.rb");
  let ruby = readFileSync(formulaPath, "utf8");
  ruby = ruby.replace(/sha256 "[^"]+"/, `sha256 "${input.ctx.archive.sha}"`);
  writeFileSync(formulaPath, ruby);
  syncHomebrewTapFormula(input.root, formulaPath, "openadt-mcp");
}

function patchMcpScoopManifest(input: PatchRequest): void {
  const { version, archive } = input.ctx;
  const manifestPath = join(input.root, "packaging/scoop/openadt-mcp.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    version: string;
    extract_dir: string;
    architecture: { "64bit": { url: string; hash: string } };
  };
  manifest.version = version;
  manifest.extract_dir = `openadt-mcp-${version}-${MCP_SCOOP_PLATFORM}`;
  manifest.architecture["64bit"].url =
    `https://github.com/abapify/openadt/releases/download/v${version}/${archive.name}`;
  manifest.architecture["64bit"].hash = archive.sha;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 4)}\n`);
}

function syncHomebrewTapFormula(
  root: string,
  formulaPath: string,
  product: string,
): void {
  const tapPath = join(root, `Formula/${product}.rb`);
  mkdirSync(dirname(tapPath), { recursive: true });
  const buf = readFileSync(formulaPath);
  writeFileSync(tapPath, buf);
}
