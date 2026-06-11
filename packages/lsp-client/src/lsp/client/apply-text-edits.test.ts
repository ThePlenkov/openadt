import { describe, expect, test } from 'bun:test'
import { applyTextEdits } from './apply-text-edits'

describe('applyTextEdits', () => {
  test('applies edits in descending offset order', () => {
    const text = 'hello world'
    const result = applyTextEdits(text, [
      {
        range: { start: { line: 0, character: 6 }, end: { line: 0, character: 11 } },
        newText: 'ABAP',
      },
      {
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
        newText: 'REPORT',
      },
    ])
    expect(result).toBe('REPORT ABAP')
  })
})
