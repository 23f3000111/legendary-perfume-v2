/**
 * The dashboard's control styles, as src/pages/Admin.tsx already draws them,
 * shared by the content editors so every tab reads as one tool.
 */
export const primary =
  'inline-flex items-center gap-2 rounded-sm bg-ink px-4 py-2 text-xs uppercase tracking-[0.12em] text-ivory transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-50'

export const small =
  'rounded-sm border border-line px-3 py-1.5 text-xs text-ink transition hover:border-gold disabled:cursor-not-allowed disabled:opacity-50'

export const field =
  'mt-1 block w-full border-b border-line bg-transparent py-1.5 text-sm text-ink outline-none transition focus:border-gold disabled:opacity-60'

export const panel = 'rounded-sm border border-line bg-ivory p-6'

export const danger = 'text-[#A4352C]'
