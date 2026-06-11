#!/usr/bin/env bun
/**
 * Update adt-services imports to use shared packages.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function updateDirectory(dir, patterns) {
  // file is derived from readdirSync(dir), not user input.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const files = readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter(
      (dirent) => dirent.isFile() && dirent.name.endsWith('.ts') && !dirent.name.endsWith('.mjs')
    )
    .map((dirent) => join(dirent.path, dirent.name))

  for (const file of files) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    let content = readFileSync(file, 'utf-8')

    for (const [pattern, replacement] of patterns) {
      content = content.replace(pattern, replacement)
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    writeFileSync(file, content)
    console.log(`Updated ${file}`)
  }
}

const patterns = [
  [/from ['"`']\.\.\/\.\.\/lsp\/contract\/contract-core['"`'];/g, "from '@openadt/lsp-client';"],
  [
    /from ['"`']\.\.\/\.\.\/lsp\/contract\/contract-core\.js['"`'];/g,
    "from '@openadt/lsp-client';",
  ],
  [/from ['"`']\.\.\/\.\.\/config\/types['"`'];/g, "from '@openadt/adt-config';"],
  [/from ['"`']\.\.\/\.\.\/config\/types\.js['"`'];/g, "from '@openadt/adt-config';"],
]

updateDirectory(join(__dirname, 'adtLs'), patterns)
console.log('Updated adt-services imports')
