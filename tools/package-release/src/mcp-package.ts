/**
 * MCP package layout, compile + archive, manifest patching.
 *
 * Top-level orchestrator. Heavy lifting lives in:
 *   - mcp-archive-layout.ts: pure layout planning
 *   - mcp-compile.ts:        spawns the bun compile step
 *   - mcp-manifests.ts:      patches the Homebrew + Scoop manifests
 *
 * Extracted from `tools/package-release/src/main.ts` so the new file
 * scores 10.00 on CodeScene (single-digit per-function arg counts after
 * the split).
 */
import AdmZip from "adm-zip";
import { dirname } from "node:path";
import { rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { planArchiveLayout } from "./mcp-archive-layout.ts";
import { compileMcpBinary } from "./mcp-compile.ts";
import { patchMcpManifests } from "./mcp-manifests.ts";

export type McpArchive = {
  path: string;
  name: string;
  sha: string;
};

export type McpBuildContext = {
  platform: string;
  version: string;
  archive: McpArchive;
};

export type FileChecksum = {
  filePath: string;
};

export type ArchivePackingOptions = {
  stageDir: string;
  stageDirName: string;
  archivePath: string;
  ext: string;
};

const HOST_PLATFORM_MAP: Record<string, Record<string, string>> = {
  win32: { x64: "win-x64" },
  linux: { x64: "linux-x64" },
  darwin: { arm64: "darwin-arm64", x64: "darwin-x64" },
};

export function tryCurrentMatrixPlatform(): string | null {
  if (process.env.OPENADT_MATRIX_PLATFORM) {
    return process.env.OPENADT_MATRIX_PLATFORM;
  }
  const platform = HOST_PLATFORM_MAP[process.platform];
  return platform?.[process.arch] ?? null;
}

export function packageMcpBinary(input: PackageRequest): void {
  const platform = tryCurrentMatrixPlatform();
  if (!platform) {
    // openadt-mcp does not ship for this host architecture. Skip with a warning
    // so the core `openadt` ZIP packaging still completes (this is the common
    // path for local dev on e.g. linux-arm64).
    console.warn(
      `Skipping openadt-mcp packaging: unsupported host ${process.platform}/${process.arch}. ` +
        `Set OPENADT_MATRIX_PLATFORM to override.`,
    );
    return;
  }
  const archive = buildMcpArchive({ ...input, platform });
  const ctx: McpBuildContext = { platform, version: input.version, archive };
  patchMcpManifests({ root: input.root, ctx });
  console.log(`Packaged ${archive.path}`);
  console.log(`SHA256 ${archive.sha}`);
}

type PackageRequest = {
  root: string;
  distDir: string;
  version: string;
  sha256File: (opts: FileChecksum) => string;
};

type ArchiveBuildInput = PackageRequest & { platform: string };

function buildMcpArchive(input: ArchiveBuildInput): McpArchive {
  const layout = planArchiveLayout({
    distDir: input.distDir,
    platform: input.platform,
    version: input.version,
  });
  rmSync(layout.stageDir, { recursive: true, force: true });
  compileMcpBinary({
    root: input.root,
    stageDir: layout.stageDir,
    platform: input.platform,
  });
  packArchive(layout);
  layout.sha = writeArchiveSha({
    sha256File: input.sha256File,
    archivePath: layout.archivePath,
    archiveName: layout.archiveName,
  });
  return {
    path: layout.archivePath,
    name: layout.archiveName,
    sha: layout.sha,
  };
}

type WriteArchiveShaRequest = {
  sha256File: (opts: FileChecksum) => string;
  archivePath: string;
  archiveName: string;
};

function writeArchiveSha(req: WriteArchiveShaRequest): string {
  const sha = req.sha256File({ filePath: req.archivePath });
  writeFileSync(`${req.archivePath}.sha256`, `${sha}  ${req.archiveName}\n`);
  return sha;
}

function packArchive(opts: ArchivePackingOptions): void {
  if (opts.ext === "zip") {
    const zip = new AdmZip();
    zip.addLocalFolder(opts.stageDir, opts.stageDirName);
    zip.writeZip(opts.archivePath);
    return;
  }
  const distDir = dirname(opts.archivePath);
  const tar = spawnSync("tar", ["czf", opts.archivePath, opts.stageDirName], {
    cwd: distDir,
    stdio: "inherit",
  });
  if (tar.status !== 0) {
    throw new Error(
      `tar exited with status ${tar.status ?? "unknown"} while packaging ${opts.archivePath}`,
    );
  }
}
