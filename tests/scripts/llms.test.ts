import { describe, expect, it } from 'vitest'
// @ts-expect-error: a plain .mjs build script, without types
import { llmsText } from '../../scripts/llms.mjs'

describe('llms.txt', () => {
  // A new number in the dashboard reaches answer engines with the next build,
  // as it reaches every page and the structured data.
  it('gives answer engines the site details, not a number written into the script', () => {
    const text = llmsText({
      url: 'https://legendary.com.my',
      house: { email: 'hello@legendary.com.my', whatsapp: '+60 12 345 6789' },
      collections: [],
      products: [],
      stores: [],
      articles: [],
    })
    expect(text).toContain('- Contact: hello@legendary.com.my, WhatsApp +60 12 345 6789')
    expect(text).not.toContain('383 6633')
  })
})
