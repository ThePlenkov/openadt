#!/usr/bin/env bun
/**
 * Update tool imports to use shared packages.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const files = readdirSync(__dirname, { withFileTypes: true })
  .filter(
    (dirent) =>
      dirent.isFile() &&
      dirent.name.endsWith('.ts') &&
      dirent.name !== 'index.ts' &&
      dirent.name !== 'update-imports.mjs'
  )
  .map((dirent) => dirent.name)

for (const file of files) {
  const filePath = join(__dirname, file)
  // filePath is derived from readdirSync(__dirname), not user input.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  let content = readFileSync(filePath, 'utf-8')

  // Replace imports with shared packages
  content = content.replace(/from ['"`]\.\.\/tool-factory\.js['"`];/g, "from '@openadt/mcp-tools';")

  content = content.replace(
    /from ['"`]\.\.\/\.\.\/services\/adtLs\/[^/]+\/[^/]+\.js['"`];/g,
    "from '@openadt/adt-services';"
  )

  content = content.replace(
    /from ['"`]\.\.\/\.\.\/\.\.\/lsp\/client\/lsp-transport\.js['"`];/g,
    "from '@openadt/lsp-client';"
  )

  content = content.replace(
    /from ['"`]\.\.\/\.\.\/\.\.\/lsp\/client\/call-lsp-contract\.js['"`];/g,
    "from '@openadt/lsp-client';"
  )

  content = content.replace(
    /from ['"`]\.\.\/\.\.\/\.\.\/config\/types\.js['"`];/g,
    "from '@openadt/adt-config';"
  )

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  writeFileSync(filePath, content)
  console.log(`Updated ${file}`)
}

console.log(`Updated ${files.length} tool files`)
