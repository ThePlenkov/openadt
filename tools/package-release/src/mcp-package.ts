/**
 * MCP package layout, compile + archive, manifest patching.
 *
 * Owns the openadt-mcp standalone-binary packaging path. Extracted from
 * `tools/package-release/src/main.ts` to keep that file focused on the
 * openadt jar packaging and to keep the CodeScene "Pay Down Tech Debt"
 * delta gate green on new files.
 */
import AdmZip from "adm-zip";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

export type McpArchive = {
  path: string;
  name: string;
  sha: string;
};

export type ArchivePackingOptions = {
  stageDir: string;
  stageDirName: string;
  archivePath: string;
  ext: string;
};

export type McpBuildContext = {
  platform: string;
  version: string;
  archive: McpArchive;
};

export type FileChecksum = {
  filePath: string;
};

const MCP_HOMEBREW_PLATFORM = "darwin-arm64";
const NATIVE_BINARY_NAMES_FALLBACK: string[] = [
  "openadt-mcp",
  "openadt-mcp.exe",
];

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

export function packageMcpBinary(
  root: string,
  distDir: string,
  version: string,
  sha256File: (opts: FileChecksum) => string,
): void {
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
  const archive = buildMcpArchive({
    root,
    distDir,
    platform,
    version,
    sha256File,
  });
  const ctx: McpBuildContext = { platform, version, archive };
  patchMcpManifests(root, ctx);
  console.log(`Packaged ${archive.path}`);
  console.log(`SHA256 ${archive.sha}`);
}

function buildMcpArchive(input: ArchiveBuildInput): McpArchive {
  const layout = planArchiveLayout(
    input.distDir,
    input.platform,
    input.version,
  );
  rmSync(layout.stageDir, { recursive: true, force: true });
  compileMcpBinary(input.root, layout.stageDir, input.platform);
  packArchive(layout);
  layout.sha = writeArchiveSha(
    input.sha256File,
    layout.archivePath,
    layout.archiveName,
  );
  return {
    path: layout.archivePath,
    name: layout.archiveName,
    sha: layout.sha,
  };
}

type ArchiveBuildInput = {
  root: string;
  distDir: string;
  platform: string;
  version: string;
  sha256File: (opts: FileChecksum) => string;
};

type ArchiveLayout = {
  stageDir: string;
  stageDirName: string;
  archivePath: string;
  archiveName: string;
  ext: string;
  sha: string;
};

function planArchiveLayout(
  distDir: string,
  platform: string,
  version: string,
): ArchiveLayout {
  const ext = platform.startsWith("win-") ? "zip" : "tar.gz";
  const stageDirName = `openadt-mcp-${version}-${platform}`;
  return {
    stageDir: join(distDir, stageDirName),
    stageDirName,
    archivePath: join(distDir, `${stageDirName}.${ext}`),
    archiveName: `${stageDirName}.${ext}`,
    ext,
    sha: "",
  };
}

function writeArchiveSha(
  sha256File: (opts: FileChecksum) => string,
  archivePath: string,
  archiveName: string,
): string {
  const sha = sha256File({ filePath: archivePath });
  writeFileSync(`${archivePath}.sha256`, `${sha}  ${archiveName}\n`);
  return sha;
}

function compileMcpBinary(
  root: string,
  stageDir: string,
  platform: string,
): void {
  const build = spawnSync(
    "bun",
    [
      "run",
      "mcp:build:compile",
      "--",
      `--platform=${platform}`,
      `--out=${stageDir}`,
    ],
    { stdio: "inherit" },
  );
  if (build.error) {
    throw new Error(
      `Failed to spawn mcp:build:compile: ${build.error.message}`,
    );
  }
  if (build.status !== 0) {
    throw new Error(
      `mcp:build:compile for ${platform} exited with status ${build.status ?? "unknown"}`,
    );
  }
}

function packArchive(opts: ArchivePackingOptions): void {
  if (opts.ext === "zip") {
    const zip = new AdmZip();
    zip.addLocalFolder(opts.stageDir, opts.stageDirName);
    zip.writeZip(opts.archivePath);
    return;
  }
  const distDir = dirname(dirname(opts.archivePath));
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

function patchMcpManifests(root: string, ctx: McpBuildContext): void {
  if (ctx.platform === MCP_HOMEBREW_PLATFORM) {
    patchMcpHomebrewFormula(root, ctx);
  }
  if (ctx.platform === "win-x64") {
    patchMcpScoopManifest(root, ctx);
  }
}

function patchMcpHomebrewFormula(root: string, ctx: McpBuildContext): void {
  const formulaPath = join(root, "packaging/homebrew/openadt-mcp.rb");
  let ruby = readFileSync(formulaPath, "utf8");
  ruby = ruby.replace(/sha256 "[^"]+"/, `sha256 "${ctx.archive.sha}"`);
  writeFileSync(formulaPath, ruby);
  syncHomebrewTapFormula(root, formulaPath, "openadt-mcp");
}

function patchMcpScoopManifest(root: string, ctx: McpBuildContext): void {
  const { version, archive } = ctx;
  const manifestPath = join(root, "packaging/scoop/openadt-mcp.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    version: string;
    extract_dir: string;
    architecture: { "64bit": { url: string; hash: string } };
  };
  manifest.version = version;
  manifest.extract_dir = `openadt-mcp-${version}-win-x64`;
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
  // Copy bytes (fs.cpSync re-exported via dynamic import to keep this file
  // dependency-free for the bun-build path).
  const buf = readFileSync(formulaPath);
  writeFileSync(tapPath, buf);
}

// Suppress unused-name warning when this file is bundled in isolation.
void NATIVE_BINARY_NAMES_FALLBACK;
