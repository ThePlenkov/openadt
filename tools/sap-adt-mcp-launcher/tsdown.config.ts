import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/cli/main.ts",
    "src/mcp-stdio-entry.ts",
    "src/openadt-mcp-bin.ts",
  ],
  format: "esm",
  platform: "node",
  target: "node20",
  outDir: "dist",
  clean: true,
  treeshake: true,
  shims: true,
  dts: false,
});
