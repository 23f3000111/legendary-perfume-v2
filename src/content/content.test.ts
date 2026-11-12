import { describe, expect, it } from 'vitest'
import faqJson from './faq.json'
import storesJson from './stores.json'
import { faq } from '../data/faq'
import { storesDoc } from '../data/stores'
import { FaqDocSchema, StoresDocSchema } from '../../api/_lib/content/schema'

describe('published content', () => {
  it('the published FAQ and stores pass their schemas', () => {
    expect(FaqDocSchema.safeParse(faq).success).toBe(true)
    expect(StoresDocSchema.safeParse(storesDoc).success).toBe(true)
  })

  // Preview swaps drafts into these objects before the first render, so the
  // site must read the JSON objects themselves, not copies made at load.
  it('the site reads the very objects the JSON files export', () => {
    expect(faq).toBe(faqJson)
    expect(storesDoc).toBe(storesJson)
  })
})
