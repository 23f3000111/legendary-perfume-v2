import type { AccentKey } from '../data/products'

interface AccentTone {
  hex: string
  soft: string   // translucent wash background
  ink: string    // readable text-on-light version
  /** Lifted version, for copy set straight onto photography. */
  onDark: string
}

export const accents: Record<AccentKey, AccentTone> = {
  gold:     { hex: '#B08D3E', soft: 'rgba(176,141,62,0.12)',  ink: '#8A6D2A', onDark: '#E2C378' },
  rose:     { hex: '#C24E63', soft: 'rgba(194,78,99,0.12)',   ink: '#A63B50', onDark: '#EE93A5' },
  jade:     { hex: '#6E8F5B', soft: 'rgba(110,143,91,0.14)',  ink: '#557345', onDark: '#AFCE9C' },
  amber:    { hex: '#C98A3E', soft: 'rgba(201,138,62,0.13)',  ink: '#A96E28', onDark: '#EDBA7B' },
  plum:     { hex: '#7E5A86', soft: 'rgba(126,90,134,0.13)',  ink: '#684872', onDark: '#C9AACF' },
  teal:     { hex: '#3FA69A', soft: 'rgba(63,166,154,0.13)',  ink: '#2C7E74', onDark: '#8CDDD2' },
  graphite: { hex: '#3A3F45', soft: 'rgba(58,63,69,0.10)',    ink: '#2A2E33', onDark: '#CBD1D8' },
}

export function accent(key: AccentKey): AccentTone {
  return accents[key] ?? accents.gold
}
