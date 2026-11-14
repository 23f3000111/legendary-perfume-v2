import { describe, expect, it } from 'vitest'
import { applyDrafts } from '../content/preview'
import { CONTENT } from '../content/registry'
import siteJson from '../content/site.json'
import { organisationLd } from '../lib/seo'
import { site, waChat, waLink } from './site'

describe('the site details', () => {
  it('WhatsApp links are made from the number as written', () => {
    expect(waLink('Hi Legendary!')).toBe(
      'https://api.whatsapp.com/send/?phone=%2B60193836633&text=Hi%20Legendary!&type=phone_number&app_absent=0',
    )
    expect(waChat()).toBe('https://api.whatsapp.com/send/?phone=%2B60193836633')
  })

  // A new number in the dashboard reaches every WhatsApp button, the header's
  // chat link and what search engines are told, in preview and once live.
  it('every WhatsApp link follows the site details', () => {
    const saved = structuredClone(siteJson)
    try {
      applyDrafts({ site: { ...saved, whatsapp: '+60 12 345 6789' } }, CONTENT)
      expect(waLink('Hi')).toContain('phone=%2B60123456789&')
      expect(waChat()).toBe('https://api.whatsapp.com/send/?phone=%2B60123456789')
      expect(organisationLd().telephone).toBe('+60 12 345 6789')
    } finally {
      applyDrafts({ site: saved }, CONTENT)
    }
    expect(waChat()).toBe('https://api.whatsapp.com/send/?phone=%2B60193836633')
  })

  it('search engines are given the links the site shows', () => {
    expect(organisationLd().sameAs).toEqual([site.instagram.url, site.facebook.url, site.tiktok, site.shopee])
  })
})
