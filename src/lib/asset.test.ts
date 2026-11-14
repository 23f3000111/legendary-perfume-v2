import { describe, expect, it } from 'vitest'
import { resolveAsset } from './asset'

describe('asset paths', () => {
  // The GitHub Pages preview serves the site under /legendary-perfume-v2.
  // A path that is resolved twice, as a map card's photo can be, must still
  // point at one copy of the base, not two.
  it('asset is idempotent', () => {
    const base = '/legendary-perfume-v2'
    const once = resolveAsset('/assets/client/p-orchid-life.webp', base)
    expect(once).toBe('/legendary-perfume-v2/assets/client/p-orchid-life.webp')
    expect(resolveAsset(once, base)).toBe(once)
    expect(resolveAsset('/assets/client/x.webp', '')).toBe('/assets/client/x.webp')
  })
})
