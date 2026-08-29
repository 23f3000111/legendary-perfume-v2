import { Link } from 'react-router-dom'
import { reviews, reviewsUrl } from '../data/reviews'
import { RevealGroup, RevealItem } from '../components/ui/Reveal'
import { Kicker } from '../components/ui/SplitText'
import { ArrowRight } from '../components/ui/icons'

/** Replaces the journal preview on the home page, per the client's brief. */
export default function Reviews() {
  return (
    <section className="bg-ivory py-24 md:py-32">
      <div className="u-container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Kicker>Tiny Reviews. Big Love.</Kicker>
            <h2 className="mt-4 font-display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.02]">
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

        {/* Revision 5: the client's ten real Shopee reviews replaced four
            placeholders, and they run to very different lengths. A fixed grid
            left a ragged half row and stretched the short ones to match the
            long ones, so the wall is set in columns instead: each card keeps
            its own height and the copy packs tightly whatever the count. */}
        <RevealGroup className="mt-12 sm:columns-2 lg:columns-3 xl:columns-4 [column-gap:1.5rem]">
          {reviews.map((r) => (
            /* The column child is a plain element and the animated one sits
               inside it: a transform on the child itself can upset how a
               browser breaks the column. */
            <div key={`${r.author}-${r.product ?? ''}`} className="mb-6 break-inside-avoid">
              <RevealItem className="flex flex-col border-t border-line pt-6">
                <span className="font-display text-3xl leading-none text-gold/50" aria-hidden>“</span>
                <p className="mt-3 font-display text-base italic leading-snug text-ink-soft">
                  {r.quote}
                </p>
                <p className="mt-5 text-sm text-ink">{r.author}</p>
                {r.product &&
                  (r.href ? (
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noreferrer"
                      className="eyebrow eyebrow-gold mt-0.5 self-start transition hover:text-gold-deep"
                    >
                      {r.product}
                    </a>
                  ) : (
                    <p className="eyebrow eyebrow-gold mt-0.5">{r.product}</p>
                  ))}
              </RevealItem>
            </div>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
