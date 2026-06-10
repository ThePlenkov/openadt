import { describe, expect, test } from 'bun:test'
import {
  ADT_LSP_WORKFLOW_PROMPT,
  getGuidancePrompt,
  guidancePromptDefs,
  isGuidancePrompt,
} from './guidance'

describe('adt-lsp-mcp guidance', () => {
  test('guidancePromptDefs lists adt_lsp_workflow', () => {
    const defs = guidancePromptDefs()
    expect(defs).toHaveLength(1)
    expect(defs[0]?.name).toBe(ADT_LSP_WORKFLOW_PROMPT)
    expect(defs[0]?.description).toContain('getLsUri')
  })

  test('isGuidancePrompt recognizes workflow prompt', () => {
    expect(isGuidancePrompt(ADT_LSP_WORKFLOW_PROMPT)).toBe(true)
    expect(isGuidancePrompt('other')).toBe(false)
  })

  test('getGuidancePrompt returns workflow markdown', () => {
    const result = getGuidancePrompt(ADT_LSP_WORKFLOW_PROMPT)
    expect(result.messages).toHaveLength(1)
    const text = result.messages[0]?.content.text ?? ''
    expect(text).toContain('adt-lsp-mcp')
    expect(text).toContain('adtLs/cts/transport')
    expect(text).toContain('getLsUri')
    expect(text).toContain('~/.adtls')
  })

  test('getGuidancePrompt rejects unknown names', () => {
    expect(() => getGuidancePrompt('unknown')).toThrow(/Unknown guidance prompt/)
  })
})
