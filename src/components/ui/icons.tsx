import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = (p: P) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...p,
})

export const Search = (p: P) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
)
export const User = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /></svg>
)
export const Bag = (p: P) => (
  <svg {...base(p)}><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
)
export const Heart = (p: P) => (
  <svg {...base(p)}><path d="M12 20s-7-4.3-9.3-8.6C1.2 8.6 2.6 5.5 5.7 5.5c2 0 3.2 1.2 4.3 2.7 1.1-1.5 2.3-2.7 4.3-2.7 3.1 0 4.5 3.1 3 5.9C19 15.7 12 20 12 20Z" /></svg>
)
export const HeartFilled = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M12 20s-7-4.3-9.3-8.6C1.2 8.6 2.6 5.5 5.7 5.5c2 0 3.2 1.2 4.3 2.7 1.1-1.5 2.3-2.7 4.3-2.7 3.1 0 4.5 3.1 3 5.9C19 15.7 12 20 12 20Z" /></svg>
)
export const Close = (p: P) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
)
export const Plus = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
)
export const Minus = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14" /></svg>
)
export const ArrowRight = (p: P) => (
  <svg {...base(p)}><path d="M4 12h15M13 6l6 6-6 6" /></svg>
)
export const ArrowLeft = (p: P) => (
  <svg {...base(p)}><path d="M20 12H5M11 6l-6 6 6 6" /></svg>
)
export const ArrowUpRight = (p: P) => (
  <svg {...base(p)}><path d="M7 17 17 7M8 7h9v9" /></svg>
)
export const ChevronDown = (p: P) => (
  <svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>
)
export const ChevronRight = (p: P) => (
  <svg {...base(p)}><path d="m9 6 6 6-6 6" /></svg>
)
export const Pin = (p: P) => (
  <svg {...base(p)}><path d="M12 21s7-6.1 7-11a7 7 0 0 0-14 0c0 4.9 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
)
export const Phone = (p: P) => (
  <svg {...base(p)}><path d="M6 3h3l1.5 5-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 5 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2 2 2 0 0 1 6 3Z" /></svg>
)
export const Clock = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
)
export const Sparkle = (p: P) => (
  <svg {...base(p)}><path d="M12 3c.5 4 2 5.5 6 6-4 .5-5.5 2-6 6-.5-4-2-5.5-6-6 4-.5 5.5-2 6-6Z" /></svg>
)
export const Check = (p: P) => (
  <svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7" /></svg>
)
export const Menu = (p: P) => (
  <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
)
export const Send = (p: P) => (
  <svg {...base(p)}><path d="M4 12 20 4l-6 16-3-7-7-1Z" /></svg>
)
export const Droplet = (p: P) => (
  <svg {...base(p)}><path d="M12 3s6 6.4 6 10.5A6 6 0 0 1 6 13.5C6 9.4 12 3 12 3Z" /></svg>
)
export const Truck = (p: P) => (
  <svg {...base(p)}><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" /><circle cx="7" cy="17" r="1.6" /><circle cx="17" cy="17" r="1.6" /></svg>
)
export const Gift = (p: P) => (
  <svg {...base(p)}><path d="M4 11h16v9H4zM4 8h16v3H4zM12 8v12" /><path d="M12 8S9.5 8 8.7 6.6C8 5.4 9 4 10.2 4.4 11.4 4.8 12 8 12 8Zm0 0s2.5 0 3.3-1.4C16 5.4 15 4 13.8 4.4 12.6 4.8 12 8 12 8Z" /></svg>
)
export const ShieldCheck = (p: P) => (
  <svg {...base(p)}><path d="M12 3 5 6v5c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
)
export const Compass = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></svg>
)

export const WhatsApp = (p: P) => (
  <svg {...base({ strokeWidth: 0, ...p })} fill="currentColor" stroke="none">
    <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.6-6.1c-.25-.13-1.5-.74-1.7-.82-.23-.08-.4-.13-.56.13-.17.25-.65.82-.8.99-.14.16-.29.18-.54.06a6.7 6.7 0 0 1-2-1.23 7.4 7.4 0 0 1-1.36-1.7c-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.42h-.48c-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.05 0 1.2.88 2.37 1 2.53.12.17 1.73 2.65 4.2 3.71.59.26 1.04.4 1.4.52.59.18 1.12.16 1.54.1.47-.07 1.5-.61 1.71-1.2.21-.6.21-1.1.15-1.2-.06-.11-.22-.17-.47-.29Z" />
  </svg>
)
export const Instagram = (p: P) => (
  <svg {...base(p)}><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><circle cx="16.8" cy="7.2" r="0.9" fill="currentColor" stroke="none" /></svg>
)
export const Facebook = (p: P) => (
  <svg {...base(p)}><path d="M14 8.5h2V5.5h-2.2C11.6 5.5 10.5 7 10.5 9v1.5H8.5V13h2v6h3v-6h2.1l.4-2.5H13.5V9c0-.4.2-.5.5-.5Z" /></svg>
)
export const TikTok = (p: P) => (
  <svg {...base(p)}><path d="M14 4c.3 2 1.6 3.4 3.7 3.6v2.5c-1.2 0-2.4-.4-3.4-1v5.2A4.9 4.9 0 1 1 9.5 9.4v2.6a2.3 2.3 0 1 0 1.9 2.3V4H14Z" /></svg>
)
