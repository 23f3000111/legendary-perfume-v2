import { exitPreview, isPreview } from '../content/preview'

/**
 * Says plainly that this tab shows the dashboard's drafts, not the live site,
 * and offers the way back out. Bottom left, clear of the concierge launcher on
 * the right. Nothing renders outside preview.
 */
export default function PreviewRibbon() {
  if (!isPreview()) return null
  return (
    <div
      role="status"
      className="fixed bottom-5 left-5 z-[88] flex items-center gap-3 rounded-full bg-ink/95 py-2 pl-4 pr-2 text-ivory shadow-lg backdrop-blur md:bottom-7 md:left-7"
    >
      <span className="h-2 w-2 rounded-full bg-gold" aria-hidden />
      <span className="text-[0.68rem] uppercase tracking-[0.16em]">Preview, not published</span>
      <button
        onClick={exitPreview}
        className="rounded-full border border-ivory/25 px-3 py-1 text-[0.65rem] uppercase tracking-[0.14em] transition hover:border-ivory/60"
      >
        Exit preview
      </button>
    </div>
  )
}
