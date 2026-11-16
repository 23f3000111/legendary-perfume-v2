import { describe, expect, it } from 'vitest'
import heroJson from '../../src/content/hero.json'
import { HeroDocSchema, mediaRefs } from '../../api/_lib/content/schema'

const firstIssue = (doc: unknown) => {
  const result = HeroDocSchema.safeParse(doc)
  return result.success ? null : { path: result.error.issues[0].path, message: result.error.issues[0].message }
}

describe('the hero poster document', () => {
  it('the seeded hero document is valid', () => {
    expect(firstIssue(heroJson)).toBeNull()
  })

  // The boxes say what must stay in view; one with no size says nothing.
  it('a box with no width or height is refused', () => {
    const doc = structuredClone(heroJson)
    doc.poster.words = [0.5, 0.3, 0.5, 0.7]
    expect(firstIssue(doc)).toEqual({ path: ['poster', 'words'], message: 'Give the box some width and height.' })
  })

  it('a publish carries every print of the poster and its fill', () => {
    const files = ['a', 'b', 'c', 'd'].map((c) => `/assets/cms/${c.repeat(20)}.webp`)
    const doc = structuredClone(heroJson)
    doc.poster.image = {
      prints: [
        { path: files[0], width: 1280 },
        { path: files[1], width: 2400 },
        { path: files[2], width: 3200 },
      ],
      fill: files[3],
      width: 3200,
      height: 1800,
    }
    expect(firstIssue(doc)).toBeNull()
    expect(mediaRefs(doc).sort()).toEqual(files)
  })
})
