import { describe, expect, it } from 'vitest'
import { addColumn, BLOCK_LABELS, blankBlock, estimateMinutes, insertAt, moveItem, removeColumn, setOptional } from './blocks'

/** `n` words of filler. */
const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ')

describe('article blocks', () => {
  it('blankBlock gives each type the fields its form needs', () => {
    for (const t of Object.keys(BLOCK_LABELS) as (keyof typeof BLOCK_LABELS)[]) {
      expect(blankBlock(t).t).toBe(t)
    }
    expect(blankBlock('table')).toEqual({ t: 'table', head: ['', ''], rows: [['', '']] })
    expect(blankBlock('image')).toEqual({ t: 'image', src: '', alt: '' })
    expect(blankBlock('faq')).toEqual({ t: 'faq', items: [{ q: '', a: '' }] })
    expect(blankBlock('ul')).toEqual({ t: 'ul', items: [] })
  })

  // A long article must not need dozens of moves to put something in its middle.
  it('insertAt puts a block right after the one chosen', () => {
    const list = ['a', 'b', 'c']
    expect(insertAt(list, 2, 'x')).toEqual(['a', 'b', 'x', 'c'])
    expect(list).toEqual(['a', 'b', 'c'])
  })

  it('moveItem moves one place', () => {
    expect(moveItem(['a', 'b', 'c'], 2, 1)).toEqual(['a', 'c', 'b'])
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c'])
  })

  it('adding and removing a column keeps every row the same width', () => {
    const table = { t: 'table' as const, head: ['A', 'B'], rows: [['1', '2'], ['3', '4']] }
    const wider = addColumn(table)
    expect(wider).toEqual({ t: 'table', head: ['A', 'B', ''], rows: [['1', '2', ''], ['3', '4', '']] })
    expect(removeColumn(wider)).toEqual(table)

    // Between one and six columns, as the schema allows.
    const six = { t: 'table' as const, head: ['1', '2', '3', '4', '5', '6'], rows: [['a', 'b', 'c', 'd', 'e', 'f']] }
    expect(addColumn(six)).toEqual(six)
    const one = { t: 'table' as const, head: ['Only'], rows: [['x']] }
    expect(removeColumn(one)).toEqual(one)
  })

  it('estimateMinutes counts what a reader reads, at 200 words a minute', () => {
    expect(estimateMinutes([{ t: 'p', text: words(450) }])).toBe(3)
    // 398 words and a two-word link are 400 words, two minutes: the address is not read.
    expect(estimateMinutes([{ t: 'p', text: `${words(398)} [two words](/x)` }])).toBe(2)
    expect(estimateMinutes([])).toBe(1)
  })

  it('counts the words in lists, tables, questions and captions', () => {
    // 100 + 1 + 100 + 1 + 100 + 99 = 401 words: three minutes. Leave any one out and it is two.
    const body = [
      { t: 'ul' as const, items: [words(100)] },
      { t: 'table' as const, head: ['Place'], rows: [[words(100)]] },
      { t: 'faq' as const, items: [{ q: 'Why?', a: words(100) }] },
      { t: 'image' as const, src: '/assets/cms/abc.webp', alt: 'Not read on the page', caption: words(99) },
    ]
    expect(estimateMinutes(body)).toBe(3)
  })

  // An optional field the team empties is left out, not saved as ''.
  it('setOptional leaves out a field that is emptied', () => {
    const quote = { t: 'quote' as const, text: 'Heritage becomes fragrance.', cite: 'A' }
    expect(setOptional(quote, 'cite', '  ')).toEqual({ t: 'quote', text: 'Heritage becomes fragrance.' })
    expect(setOptional(quote, 'cite', 'B')).toEqual({ ...quote, cite: 'B' })

    const photo = { t: 'image' as const, src: '/assets/cms/abc.webp', alt: 'A shopfront', narrow: true }
    expect(setOptional(photo, 'narrow', false)).toEqual({ t: 'image', src: '/assets/cms/abc.webp', alt: 'A shopfront' })
    expect(setOptional({ ...photo, narrow: undefined }, 'narrow', true)).toEqual(photo)
  })
})
