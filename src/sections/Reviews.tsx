import { useState } from 'react'
import { Link } from 'react-router-dom'
import { reviews, reviewsUrl, type Review } from '../data/reviews'
import { RevealGroup, RevealItem } from '../components/ui/Reveal'
import { Kicker } from '../components/ui/SplitText'
import { ArrowRight, Star } from '../components/ui/icons'

/**
 * The customer wall, replacing the journal preview on the home page.
 *
 * Client note: the previous pass set these in CSS columns so each card could
 * keep its natural height. That packed tightly and read badly. Columns fill top
 * to bottom before they wrap, so the reading order ran down one column and back
 * up the next, the column feet ended at different heights, and the whole thing
 * looked like a pile rather than an arrangement.
 *
 * So it is a grid now, and the cards are the same size. The reviews genuinely
 * do run from one line to a full paragraph, and the way to make that sit level
 * is to give every card the same frame and clamp the long ones, with a "read
 * more" for anybody who wants the rest. Below `sm` it becomes a snap scroller,
 * which suits a phone better than eleven stacked cards.
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
    <RevealItem className="flex h-full flex-col border border-line bg-porcelain p-6 transition-colors duration-500 hover:border-gold/40">
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

        {/* A phone gets a snap scroller: eleven stacked cards is a long way to
            scroll past, and swiping through them reads as a deliberate rail.
            Everything wider gets the grid. The negative margin lets the rail
            bleed to the screen edge while the cards keep the container's
            gutter, so the first one lines up with the heading above it. */}
        <RevealGroup
          className="
            mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4
            [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
            -mx-5 px-5
            sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0
            lg:grid-cols-3 xl:grid-cols-4
          "
        >
          {reviews.map((r) => (
            <div
              key={`${r.author}-${r.product ?? ''}`}
              className="w-[80vw] max-w-xs shrink-0 snap-start sm:w-auto sm:max-w-none"
            >
              <Card review={r} />
            </div>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
