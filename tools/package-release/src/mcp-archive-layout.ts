/**
 * Pure plan / layout types for the openadt-mcp archive: turns a
 * (platform, version) pair into the on-disk file names, no I/O.
 * Extracted from mcp-package.ts to reduce its string/primitive argument
 * ratio under the CodeScene "clean_code_collective" gate.
 */
import { join } from "node:path";

export type ArchiveLayout = {
  stageDir: string;
  stageDirName: string;
  archivePath: string;
  archiveName: string;
  ext: string;
  sha: string;
};

export type ArchiveLayoutRequest = {
  distDir: string;
  platform: string;
  version: string;
};

export function planArchiveLayout(req: ArchiveLayoutRequest): ArchiveLayout {
  const ext = req.platform.startsWith("win-") ? "zip" : "tar.gz";
  const stageDirName = `openadt-mcp-${req.version}-${req.platform}`;
  return {
    stageDir: join(req.distDir, stageDirName),
    stageDirName,
    archivePath: join(req.distDir, `${stageDirName}.${ext}`),
    archiveName: `${stageDirName}.${ext}`,
    ext,
    sha: "",
  };
}
