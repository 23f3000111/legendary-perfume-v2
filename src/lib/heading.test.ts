import { describe, expect, it } from 'vitest'
import { headingLines } from './heading'

describe('page headings', () => {
  // A heading that breaks over two lines today keeps that as a newline, and a
  // word set in gold italic is written *like this*.
  it('headings keep their line breaks and their gold word', () => {
    expect(headingLines('Every scent is born\nof a *place*')).toEqual([
      [{ text: 'Every scent is born', accent: false }],
      [
        { text: 'of a ', accent: false },
        { text: 'place', accent: true },
      ],
    ])
    // A lone star is a character, not the start of a gold word.
    expect(headingLines('5 * stars')).toEqual([[{ text: '5 * stars', accent: false }]])
  })
})
