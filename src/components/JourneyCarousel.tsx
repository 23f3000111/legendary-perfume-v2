import { useState } from 'react'
import { motion } from 'framer-motion'
import { asset } from '../lib/asset'

export interface Milestone {
  year: string
  title: string
  body: string
}

/**
 * "Eleven years, in scent" — client asked for a carousel whose panel enlarges
 * when hovered. On desktop the active panel takes a wider flex basis; on
 * touch the row becomes a horizontal snap scroller.
 *
 * Revision 4: the client asked for the title to come forward first and the
 * body to follow, and for the whole move to be smoother. The panel, the title
 * and the body now run on one easing curve at three offsets: the panel opens,
 * the title lifts into it, then the body unfolds behind them. The body's
 * height is animated to its measured value rather than eased against a fixed
 * max-height, which is what made the old reveal snap at the end.
 */

const EASE = [0.16, 1, 0.3, 1] as const

export default function JourneyCarousel({ milestones }: { milestones: Milestone[] }) {
  const [active, setActive] = useState(3)

  return (
    <div className="mt-14">
      {/* Year of the focused panel.
          Client amendment: every figure in this section is set in Minion
          Variable Concept Regular. */}
      <p
        key={milestones[active].year}
        className="text-center font-minion text-[clamp(2.4rem,5vw,3.6rem)] font-normal leading-none text-ivory"
      >
        {milestones[active].year}
      </p>

      <div className="mt-8 flex gap-3 overflow-x-auto pb-4 md:overflow-visible">
        {milestones.map((m, i) => {
          const isActive = i === active
          return (
            <button
              key={m.year}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-label={`${m.year}: ${m.title}`}
              className={`group relative h-[22rem] shrink-0 overflow-hidden rounded-sm text-left transition-[flex] duration-[900ms] ease-luxe md:h-[26rem] md:shrink ${
                isActive ? 'md:flex-[2.2]' : 'md:flex-1'
              }`}
              style={{ width: 'min(72vw, 15rem)' }}
            >
              <img
                src={asset(`/assets/client/journey-${m.year}.webp`)}
                alt=""
                className={`h-full w-full object-cover transition-all duration-[900ms] ease-luxe ${
                  isActive ? 'scale-100 grayscale-0' : 'scale-105 grayscale'
                }`}
                loading="lazy"
              />
              <div
                className={`absolute inset-0 transition-opacity duration-[900ms] ${
                  isActive
                    ? 'bg-gradient-to-t from-gold-deep/90 via-gold-deep/25 to-transparent'
                    : 'bg-gradient-to-t from-ink/90 via-ink/40 to-ink/10'
                }`}
              />

              {/* Year badge, always visible so the row reads as a timeline */}
              <span className="absolute left-5 top-4 font-minion text-2xl font-normal text-ivory/85">{m.year}</span>

              <div className="absolute inset-x-0 bottom-0 p-5">
                {/* The title comes forward first: it lifts off the foot of the
                    panel and grows a little, anchored to its own left edge so
                    it does not drift sideways as it scales. */}
                <motion.h3
                  className="origin-bottom-left font-display text-xl italic text-ivory"
                  animate={{
                    y: isActive ? -2 : 4,
                    scale: isActive ? 1.06 : 1,
                    opacity: isActive ? 1 : 0.82,
                  }}
                  transition={{ duration: 0.55, ease: EASE }}
                >
                  {m.title}
                </motion.h3>

                {/* Then the body unfolds under it. */}
                <motion.div
                  className="overflow-hidden"
                  initial={false}
                  animate={{ height: isActive ? 'auto' : 0, opacity: isActive ? 1 : 0 }}
                  transition={{
                    height: { duration: 0.6, ease: EASE, delay: isActive ? 0.24 : 0 },
                    opacity: { duration: 0.5, ease: EASE, delay: isActive ? 0.3 : 0 },
                  }}
                >
                  <p className="pt-2 text-[0.8rem] leading-snug text-ivory/85">{m.body}</p>
                </motion.div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
