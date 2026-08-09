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

        <RevealGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reviews.map((r) => (
            <RevealItem
              key={r.author}
              className="flex h-full flex-col border-t border-line pt-6"
            >
              <span className="font-display text-3xl leading-none text-gold/50" aria-hidden>“</span>
              <p className="mt-3 flex-1 font-display text-lg italic leading-snug text-ink-soft">
                {r.quote}
              </p>
              <p className="mt-5 text-sm text-ink">{r.author}</p>
              {r.product && <p className="mt-0.5 eyebrow eyebrow-gold">{r.product}</p>}
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
