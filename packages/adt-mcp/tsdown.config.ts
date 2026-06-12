import { defineConfig } from 'tsdown'
import baseConfig from '../../tsdown.config.ts'

export default defineConfig({
  ...baseConfig,
  publint: false,
  entry: ['src/cli.ts', 'src/mcp-stdio-entry.ts'],
})
