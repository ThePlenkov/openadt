/**
 * Compiles the openadt-mcp Bun binary into a staging directory. Extracted
 * from mcp-package.ts so that file can drop its intrinsic string-arg
 * surface below the CodeScene "clean_code_collective" advisory threshold.
 */
import { spawnSync } from "node:child_process";

export type CompileRequest = {
  root: string;
  stageDir: string;
  platform: string;
};

export function compileMcpBinary(req: CompileRequest): void {
  const build = spawnSync(
    "bun",
    [
      "run",
      "mcp:build:compile",
      "--",
      `--platform=${req.platform}`,
      `--out=${req.stageDir}`,
    ],
    { stdio: "inherit", cwd: req.root },
  );
  if (build.error) {
    throw new Error(
      `Failed to spawn mcp:build:compile: ${build.error.message}`,
    );
  }
  if (build.status !== 0) {
    throw new Error(
      `mcp:build:compile for ${req.platform} exited with status ${build.status ?? "unknown"}`,
    );
  }
}
