import { describe, expect, it } from 'vitest'
import { hasLongDash, newId, replaceLongDashes } from './text'

describe('house style helpers', () => {
  it('replaceLongDashes turns a long dash into a comma', () => {
    expect(replaceLongDashes('Spirit I — Hope')).toBe('Spirit I, Hope')
    expect(replaceLongDashes('a–b')).toBe('a, b')
    expect(replaceLongDashes('Hope — , Love')).toBe('Hope, Love')
    expect(replaceLongDashes('alcohol-free, long-lasting')).toBe('alcohol-free, long-lasting')
  })

  it('hasLongDash ignores hyphens', () => {
    expect(hasLongDash('Spirit I — Hope')).toBe(true)
    expect(hasLongDash('6–15 hours')).toBe(true)
    expect(hasLongDash('alcohol-free')).toBe(false)
  })

  it('newId has no dashes and avoids taken ids', () => {
    expect(newId('KLIA T1 · Eraman', new Set(['kliat1eraman']))).toBe('kliat1eraman2')
    expect(newId('Bangunan Sultan Abdul Samad', new Set())).toBe('bangunansultanabdulsamad')
  })

  it('newId stays within 24 characters, suffix included', () => {
    expect(newId('Pavilion Kuala Lumpur Parkson Elite', new Set())).toBe('pavilionkualalumpurparks')
    expect(newId('Pavilion Kuala Lumpur Parkson Elite', new Set(['pavilionkualalumpurparks']))).toBe(
      'pavilionkualalumpurpark2',
    )
  })

  it('newId falls back when a name has no letters or digits', () => {
    expect(newId('— ·', new Set())).toBe('item')
    expect(newId('—', new Set(['item']))).toBe('item2')
  })
})
