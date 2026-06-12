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
  publint: true,
  failOnWarn: true,
  dts: {
    eager: true,
  },
})
