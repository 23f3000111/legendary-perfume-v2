/**
 * How a page heading's text is read: a newline starts a new line, and a word
 * between stars is set in the house's gold italic, as "of a *place*" is on the
 * Home page. Nothing else, so nothing typed can break a heading's layout.
 *
 * No imports, so the shop can use it without pulling anything else in.
 */
export interface HeadingRun {
  text: string
  accent: boolean
}

/** The heading's lines, each a run of plain and gold words. A lone star stays a star. */
export function headingLines(text: string): HeadingRun[][] {
  return text.split('\n').map((line) => {
    const runs: HeadingRun[] = []
    const gold = /\*([^*\n]+)\*/g
    let last = 0
    let m: RegExpExecArray | null
    while ((m = gold.exec(line)) !== null) {
      if (m.index > last) runs.push({ text: line.slice(last, m.index), accent: false })
      runs.push({ text: m[1], accent: true })
      last = m.index + m[0].length
    }
    if (last < line.length || runs.length === 0) runs.push({ text: line.slice(last), accent: false })
    return runs
  })
}
