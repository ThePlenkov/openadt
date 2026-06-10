import { defineConfig } from 'tsdown'
import baseConfig from '../../tsdown.config.ts'

export default defineConfig({
  ...baseConfig,
  publint: false,
  entry: ['src/mcp-stdio-entry.ts'],
})
