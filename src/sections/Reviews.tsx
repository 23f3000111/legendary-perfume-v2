import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { reviews, reviewsUrl, type Review } from '../data/reviews'
import { RevealGroup, RevealItem } from '../components/ui/Reveal'
import { Kicker } from '../components/ui/SplitText'
import { ArrowRight, ChevronLeft, ChevronRight, Star } from '../components/ui/icons'

/**
 * The customer wall, replacing the journal preview on the home page.
 *
 * Client note: the previous pass set these in CSS columns so each card could
 * keep its natural height. That packed tightly and read badly. Columns fill top
 * to bottom before they wrap, so the reading order ran down one column and back
 * up the next, the column feet ended at different heights, and the whole thing
 * looked like a pile rather than an arrangement.
 *
 * So every card takes the same frame and the long ones clamp, with a "read
 * more" for anybody who wants the rest.
 *
 * Revision 7, "amend to only one row": the grid wrapped onto two and three
 * rows, which gave a block of eleven reviews the weight of a whole section. It
 * is one row now at every width, scrolled sideways. Nothing is lost, since all
 * eleven are still there to swipe through, and on a desktop a pair of arrows
 * appears on hover so a mouse has something to press.
 */
function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} width={13} className={i < count ? 'text-gold' : 'text-line'} />
      ))}
    </div>
  )
}

function Card({ review }: { review: Review }) {
  const [open, setOpen] = useState(false)
  // Long enough that most reviews are untouched and only the essays clamp.
  const long = review.quote.length > 190

  return (
    <RevealItem className="flex h-full w-full flex-col border border-line bg-porcelain p-6 transition-colors duration-500 hover:border-gold/40">
      <Stars count={review.rating ?? 5} />

      <p
        className={`mt-4 flex-1 font-display text-[0.98rem] italic leading-relaxed text-ink-soft ${
          long && !open ? 'line-clamp-6' : ''
        }`}
      >
        {review.quote}
      </p>

      {long && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-2 self-start text-[0.7rem] uppercase tracking-[0.14em] text-gold-deep transition hover:text-ink"
        >
          {open ? 'Show less' : 'Read more'}
        </button>
      )}

      <div className="mt-5 border-t border-line pt-4">
        <p className="text-sm text-ink">{review.author}</p>
        {review.product &&
          (review.href ? (
            <a
              href={review.href}
              target="_blank"
              rel="noreferrer"
              className="eyebrow eyebrow-gold mt-1 inline-block transition hover:text-gold-deep"
            >
              {review.product}
            </a>
          ) : (
            <p className="eyebrow eyebrow-gold mt-1">{review.product}</p>
          ))}
      </div>
    </RevealItem>
  )
}

export default function Reviews() {
  const rail = useRef<HTMLDivElement>(null)
  // Whether there is anywhere left to go, so an arrow that would do nothing
  // is not offered. Eleven cards always overflow a phone, but four of them on
  // a wide desktop may not.
  const [canScroll, setCanScroll] = useState({ left: false, right: false })

  const measure = useCallback(() => {
    const el = rail.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setCanScroll({ left: el.scrollLeft > 8, right: el.scrollLeft < max - 8 })
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  const nudge = (direction: 1 | -1) => {
    const el = rail.current
    if (!el) return
    const card = el.querySelector('[data-review-card]') as HTMLElement | null
    const step = (card?.offsetWidth ?? 320) + 20
    el.scrollBy({ left: direction * step * 2, behavior: 'smooth' })
  }

  return (
    <section className="bg-ivory py-20 md:py-32">
      <div className="u-container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Kicker>Tiny Reviews. Big Love.</Kicker>
            <h2 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.6rem)] leading-[1.05]">
              What our customers say
            </h2>
          </div>
          <Link
            to={reviewsUrl}
            className="group flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-ink"
          >
            What our Customers Buy
            <ArrowRight width={15} className="text-gold transition-transform duration-500 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* One row, scrolled sideways, at every width. The negative margin lets
            the rail bleed to the screen edge while the cards keep the
            container's gutter, so the first one lines up with the heading
            above it. */}
        <div className="group/rail relative">
          <div
            ref={rail}
            onScroll={measure}
            className="
              mt-10 snap-x snap-mandatory overflow-x-auto pb-4
              [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
              -mx-5 px-5 sm:-mx-8 sm:px-8 lg:-mx-14 lg:px-14
              scroll-pl-5 sm:scroll-pl-8 lg:scroll-pl-14
            "
          >
            <RevealGroup className="flex items-stretch gap-4 sm:gap-5">
              {reviews.map((r) => (
                <div
                  key={`${r.author}-${r.product ?? ''}`}
                  data-review-card
                  className="flex w-[80vw] max-w-xs shrink-0 snap-start sm:w-[19rem] sm:max-w-none"
                >
                  <Card review={r} />
                </div>
              ))}
            </RevealGroup>
          </div>

          {/* Arrows for a mouse. Out on hover, and never shown for a direction
              that has nowhere to go. A finger just swipes. */}
          {([['left', -1], ['right', 1]] as const).map(([side, direction]) => (
            <button
              key={side}
              onClick={() => nudge(direction)}
              aria-label={side === 'left' ? 'Previous reviews' : 'Next reviews'}
              className={`
                absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center
                rounded-full border border-line bg-ivory/95 text-ink shadow-[0_6px_20px_-8px_rgba(28,24,21,0.4)]
                backdrop-blur transition-opacity duration-300 hover:border-gold hover:text-gold-deep
                ${side === 'left' ? '-left-2' : '-right-2'}
                ${canScroll[side] ? '[@media(hover:hover)]:grid' : ''}
                opacity-0 group-hover/rail:opacity-100
              `}
            >
              {side === 'left' ? <ChevronLeft width={18} /> : <ChevronRight width={18} />}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
