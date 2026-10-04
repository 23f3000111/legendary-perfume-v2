import { create } from 'zustand'

interface UIState {
  cartOpen: boolean
  conciergeOpen: boolean
  menuOpen: boolean
  cartPulse: number
  /**
   * Whether what the home hero is showing is dark or light. The header sits
   * over the hero transparent, in ivory, and ivory disappears on the
   * anniversary poster's cream, so it reads this to switch to ink.
   */
  heroTone: 'dark' | 'light'
  setHeroTone: (tone: 'dark' | 'light') => void
  openCart: () => void
  closeCart: () => void
  toggleConcierge: () => void
  setConcierge: (v: boolean) => void
  toggleMenu: () => void
  closeMenu: () => void
  pulse: () => void
}

export const useUI = create<UIState>((set) => ({
  cartOpen: false,
  conciergeOpen: false,
  menuOpen: false,
  cartPulse: 0,
  heroTone: 'dark',
  setHeroTone: (tone) => set({ heroTone: tone }),
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  toggleConcierge: () => set((s) => ({ conciergeOpen: !s.conciergeOpen })),
  setConcierge: (v) => set({ conciergeOpen: v }),
  toggleMenu: () => set((s) => ({ menuOpen: !s.menuOpen })),
  closeMenu: () => set({ menuOpen: false }),
  pulse: () => set((s) => ({ cartPulse: s.cartPulse + 1 })),
}))
