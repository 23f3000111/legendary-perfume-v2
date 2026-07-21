import { create } from 'zustand'

interface UIState {
  cartOpen: boolean
  conciergeOpen: boolean
  menuOpen: boolean
  cartPulse: number
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
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  toggleConcierge: () => set((s) => ({ conciergeOpen: !s.conciergeOpen })),
  setConcierge: (v) => set({ conciergeOpen: v }),
  toggleMenu: () => set((s) => ({ menuOpen: !s.menuOpen })),
  closeMenu: () => set({ menuOpen: false }),
  pulse: () => set((s) => ({ cartPulse: s.cartPulse + 1 })),
}))
