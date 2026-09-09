import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { products } from '../data/products'
import { collections } from '../data/collections'
import { formatRM } from '../lib/format'
import { Search, Close } from './ui/icons'

/**
 * Search.
 *
 * Client note: the magnifying glass did nothing at all. It now opens this.
 *
 * The whole catalogue is eighteen fragrances and four collections, so the
 * search runs in the browser over the data the page already has. There is no
 * request to make and no index to keep in step, and results appear as the
 * visitor types rather than after a round trip.
 *
 * A fragrance is matched on everything someone might reasonably type: its name,
 * its collection, its scent family, who it is for, and its actual notes, so
 * "jasmine" or "woody" finds something even though neither word is a product
 * name.
 */
function haystack(p: (typeof products)[number]): string {
  const notes = [...p.notes.top, ...p.notes.heart, ...p.notes.base]
  const variants = p.variants?.flatMap((v) => [v.name, v.family]) ?? []
  return [p.name, p.subtitle, p.collection, p.family, p.audience, p.size, ...notes, ...variants]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

const INDEX = products.map((p) => ({ product: p, text: haystack(p) }))

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    // A frame's grace, so the field exists and the panel has begun to open
    // before the caret lands in it.
    const t = window.setTimeout(() => input.current?.focus(), 60)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { window.clearTimeout(t); window.removeEventListener('keydown', onKey) }
  }, [open, onClose])

  /* The page behind stays put while this is open. Pinned rather than merely
     hidden, which is the only way iOS keeps its scroll position. */
  useEffect(() => {
    if (!open) return
    const { body } = document
    const y = window.scrollY
    const prev = body.style.cssText
    body.style.cssText += `position:fixed;top:${-y}px;left:0;right:0;overflow:hidden;`
    return () => {
      body.style.cssText = prev
      window.scrollTo(0, y)
    }
  }, [open])

  const q = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (q.length < 2) return []
    const words = q.split(/\s+/)
    return INDEX
      .filter(({ text }) => words.every((w) => text.includes(w)))
      // A name match is what someone usually meant, so it sorts first.
      .sort((a, b) => Number(b.product.name.toLowerCase().includes(q)) - Number(a.product.name.toLowerCase().includes(q)))
      .slice(0, 6)
      .map(({ product }) => product)
  }, [q])

  const matchingCollections = useMemo(
    () => (q.length < 2 ? [] : collections.filter((c) => c.name.toLowerCase().includes(q))),
    [q],
  )

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[95] bg-ink/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search fragrances"
            className="fixed inset-x-0 top-0 z-[96] bg-ivory shadow-[0_30px_60px_-30px_rgba(28,24,21,0.5)]"
            initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="u-container py-6">
              <div className="flex items-center gap-4 border-b border-line pb-4">
                <Search width={20} className="shrink-0 text-gold" />
                <input
                  ref={input}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search a fragrance, a collection or a note"
                  className="w-full bg-transparent text-lg text-ink outline-none placeholder:text-smoke"
                />
                <button onClick={onClose} aria-label="Close search" className="shrink-0 p-1 text-smoke transition hover:text-ink">
                  <Close width={20} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {q.length >= 2 && results.length === 0 && matchingCollections.length === 0 && (
                  <p className="py-10 text-center text-sm text-smoke">
                    Nothing matches “{query}”. Try a note, like jasmine or cedar.
                  </p>
                )}

                {matchingCollections.length > 0 && (
                  <div className="pt-5">
                    <p className="eyebrow text-smoke">Collections</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {matchingCollections.map((c) => (
                        <Link
                          key={c.id}
                          to={`/shop?collection=${c.id}`}
                          onClick={onClose}
                          className="rounded-full border border-line px-4 py-1.5 text-sm text-ink transition hover:border-gold"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {results.length > 0 && (
                  <ul className="mt-5 grid gap-1 sm:grid-cols-2">
                    {results.map((p) => (
                      <li key={p.id}>
                        <Link
                          to={`/product/${p.id}`}
                          onClick={onClose}
                          className="flex items-center gap-4 rounded-sm p-2 transition hover:bg-porcelain"
                        >
                          <img src={p.image} alt="" className="h-14 w-14 shrink-0 rounded-sm object-cover" />
                          <span className="min-w-0">
                            <span className="block truncate text-ink">{p.name}</span>
                            <span className="block truncate text-xs text-smoke">
                              {p.collection} · {p.family}
                            </span>
                          </span>
                          <span className="ml-auto shrink-0 text-sm text-ink">{formatRM(p.price)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {q.length < 2 && (
                  <p className="py-8 text-sm text-smoke">
                    Type at least two letters. You can search by name, by collection, or by a note
                    such as jasmine, pandan or cedar.
                  </p>
                )}
              </div>

              {results.length > 0 && (
                <Link
                  to="/shop"
                  onClick={onClose}
                  className="mt-4 inline-block text-xs uppercase tracking-[0.16em] text-gold-deep transition hover:text-ink"
                >
                  Browse all fragrances
                </Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
