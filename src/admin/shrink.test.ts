import { describe, expect, it } from 'vitest'
import { nextScale } from './shrink'

describe('shrinking a photo under the upload limit', () => {
  it('stops once the photo fits, and shrinks by a fifth until then', () => {
    expect(nextScale(3_800_000, 3_800_000, 1)).toBeNull()
    expect(nextScale(3_800_001, 3_800_000, 1)).toBe(0.8)
    expect(nextScale(9_000_000, 3_800_000, 0.8)).toBeCloseTo(0.64)
  })

  it('shrink loop always ends under the byte limit', () => {
    // An encoded photo's size falls roughly with its area.
    const sizeAt = (scale: number) => 15_000_000 * scale * scale
    let scale = 1
    let steps = 0
    for (let next = nextScale(sizeAt(scale), 3_800_000, scale); next !== null; next = nextScale(sizeAt(scale), 3_800_000, scale)) {
      scale = next
      steps += 1
      expect(steps).toBeLessThanOrEqual(10)
    }
    expect(sizeAt(scale)).toBeLessThanOrEqual(3_800_000)
    expect(steps).toBe(4)
  })
})
