import type { JournalBlock } from '../../api/_lib/content/schema'

/**
 * The pieces an article's body is built from, as the dashboard offers them,
 * and the small list and table moves its editor makes.
 */

export type BlockType = JournalBlock['t']
export type BlockOf<T extends BlockType> = Extract<JournalBlock, { t: T }>
export type TableBlock = BlockOf<'table'>

/** What each kind of block is called in the dashboard, in the order its menu lists them. */
export const BLOCK_LABELS: Record<BlockType, string> = {
  p: 'Paragraph',
  lead: 'Opening paragraph',
  h2: 'Heading',
  h3: 'Subheading',
  ul: 'Bulleted list',
  ol: 'Numbered list',
  quote: 'Quote',
  tip: 'Tip',
  image: 'Photo',
  table: 'Table',
  cta: 'Button',
  faq: 'Questions and answers',
  refs: 'References',
}

/** A new, empty block of a kind, with every field its form shows. */
export function blankBlock(t: BlockType): JournalBlock {
  switch (t) {
    case 'p':
    case 'lead':
    case 'h2':
    case 'h3':
    case 'quote':
    case 'tip':
      return { t, text: '' }
    case 'ul':
    case 'ol':
    case 'refs':
      return { t, items: [] }
    case 'image':
      return { t, src: '', alt: '' }
    case 'table':
      return { t, head: ['', ''], rows: [['', '']] }
    case 'cta':
      return { t, label: '', to: '' }
    case 'faq':
      return { t, items: [{ q: '', a: '' }] }
  }
}

/** `list` with `item` placed at `index`. */
export function insertAt<T>(list: T[], index: number, item: T): T[] {
  return [...list.slice(0, index), item, ...list.slice(index)]
}

/** `list` with the item at `from` moved to `to`. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

const MAX_COLUMNS = 6

/** One more, empty, column at the end of the heading and of every row. Six at most. */
export function addColumn(table: TableBlock): TableBlock {
  if (table.head.length >= MAX_COLUMNS) return table
  return { ...table, head: [...table.head, ''], rows: table.rows.map((row) => [...row, '']) }
}

/** The last column gone from the heading and from every row. One always stays. */
export function removeColumn(table: TableBlock): TableBlock {
  if (table.head.length <= 1) return table
  const width = table.head.length - 1
  return { ...table, head: table.head.slice(0, width), rows: table.rows.map((row) => row.slice(0, width)) }
}

/**
 * `obj` with an optional field set, or left out when it is emptied: a blank
 * caption, a cleared "who said it", an unticked box. An optional field is never
 * saved as '' or false, so an emptied one reads exactly as one never filled.
 */
export function setOptional<T extends object, K extends string>(obj: T, key: K, value: string | boolean | undefined): T {
  const { [key]: _old, ...rest } = obj as Record<string, unknown>
  const empty = value === undefined || value === false || (typeof value === 'string' && value.trim() === '')
  return (empty ? rest : { ...rest, [key]: value }) as T
}

/** The words a reader reads in one piece of text: a link counts its label, never its address. */
function wordsIn(text: string): number {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .split(/\s+/)
    .filter(Boolean).length
}

/**
 * The running text of a block, the part that sets how long an article takes
 * to read. A photo's description is for those who cannot see it, and a
 * button's few words are passed over, not read.
 */
function readText(block: JournalBlock): string[] {
  switch (block.t) {
    case 'ul':
    case 'ol':
    case 'refs':
      return block.items
    case 'quote':
      return [block.text, block.cite ?? '']
    case 'image':
      return [block.caption ?? '']
    case 'table':
      return [...block.head, ...block.rows.flat()]
    case 'cta':
      return []
    case 'faq':
      return block.items.flatMap((item) => [item.q, item.a])
    default:
      return [block.text]
  }
}

/** Reading time in whole minutes at 200 words a minute, never under one. */
export function estimateMinutes(blocks: JournalBlock[]): number {
  const words = blocks.flatMap(readText).reduce((n, text) => n + wordsIn(text), 0)
  return Math.max(1, Math.ceil(words / 200))
}
