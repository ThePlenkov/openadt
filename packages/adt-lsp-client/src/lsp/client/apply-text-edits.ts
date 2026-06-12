/** Standard LSP text edit (0-based positions). */
export type TextEdit = {
  range: {
    start: { line: number; character: number }
    end: { line: number; character: number }
  }
  newText: string
}

/** Apply LSP TextEdit[] to source (UTF-16 code units, descending offset order). */
export function applyTextEdits(text: string, edits: TextEdit[]): string {
  if (!edits.length) return text

  const lineStarts = [0]
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') lineStarts.push(i + 1)
  }

  const toOffset = (pos: { line: number; character: number }): number => {
    if (pos.line >= lineStarts.length) return text.length
    const lineStart = lineStarts[pos.line] ?? 0
    const lineEnd =
      pos.line + 1 < lineStarts.length ? (lineStarts[pos.line + 1] ?? text.length) - 1 : text.length
    return Math.min(lineStart + Math.max(0, pos.character), lineEnd)
  }

  const sorted = [...edits].sort((a, b) => toOffset(b.range.start) - toOffset(a.range.start))
  let out = text
  for (const edit of sorted) {
    out =
      out.slice(0, toOffset(edit.range.start)) + edit.newText + out.slice(toOffset(edit.range.end))
  }
  return out
}
