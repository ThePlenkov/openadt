import { defineConfig } from 'tsdown'

export default defineConfig({
  format: 'esm',
  platform: 'node',
  target: 'node24',
  outDir: 'dist',
  clean: true,
  treeshake: true,
  shims: true,
  minify: true,
  exports: true,
  // publint runs `bun pm pack`, which cannot resolve `workspace:*` deps in a
  // fresh CI install and fails the release build. These packages are private
  // and bundled into the openadt-mcp binary, never published to npm, so
  // publish-time validation adds no value here. (adt-mcp already sets false.)
  publint: false,
  failOnWarn: true,
  dts: {
    eager: true,
  },
})
