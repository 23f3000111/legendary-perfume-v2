import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { asset } from '../lib/asset'

export interface Milestone {
  year: string
  title: string
  body: string
  /**
   * False where the delivery carries no photograph for that year. The panel
   * falls back to the house pattern rather than a broken image, and picks the
   * shot up the moment `journey-<year>.webp` exists.
   */
  art?: boolean
}

/**
 * "The Journey" — a carousel whose panel enlarges when hovered. On desktop the
 * active panel takes a wider flex basis; on touch the row becomes a horizontal
 * snap scroller.
 *
 * Revision 5: the client asked for the animation to change, because "the words
 * popping from middle and drop down" did not look smooth. Both halves of that
 * were layout animations fighting the panel's own width transition:
 *
 *  - The year above the row carried a React `key`, so every hover unmounted it
 *    and mounted a new one. There was no transition at all, only a hard swap.
 *    It now cross dissolves in place, stacked, so the row beneath never shifts.
 *  - The body opened by animating its height from zero while the panel was
 *    still widening, so the copy rewrapped on every frame and the title scaled
 *    underneath it. Nothing animates layout any more. The body's space is
 *    reserved on every panel and pinned to the open width, so its line breaks
 *    are settled before it is ever seen, and the reveal is opacity and a small
 *    translate only. Titles now share one baseline across the row as well.
 */

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * The copy is pinned to one width so its line breaks are identical whatever
 * the panel is currently doing. It has to fit inside the narrowest panel the
 * row ever draws, which is the 15rem closed panel less its 5 padding either
 * side, so 12.5rem rather than the open panel's full measure.
 */
const COPY_WIDTH = '12.5rem'

export default function JourneyCarousel({ milestones }: { milestones: Milestone[] }) {
  const [active, setActive] = useState(3)

  return (
    <div className="mt-14">
      {/* Year of the focused panel. Client amendment: every figure in this
          section is set in Minion Variable Concept Regular.

          The two years are stacked rather than swapped in flow, so the row
          below holds still while one dissolves into the other. */}
      <div className="relative h-[clamp(2.4rem,5vw,3.6rem)]">
        <AnimatePresence initial={false}>
          <motion.p
            key={milestones[active].year}
            className="absolute inset-x-0 text-center font-minion text-[clamp(2.4rem,5vw,3.6rem)] font-normal leading-none text-ivory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            {milestones[active].year}
          </motion.p>
        </AnimatePresence>
      </div>

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
              {m.art === false ? (
                <div className="h-full w-full bg-gold-deep/25">
                  <div
                    className={`peranakan h-full w-full transition-opacity duration-[900ms] ${
                      isActive ? 'opacity-30' : 'opacity-15'
                    }`}
                    style={{ color: '#CBAA5D' }}
                  />
                </div>
              ) : (
                <img
                  src={asset(`/assets/client/journey-${m.year}.webp`)}
                  alt=""
                  className={`h-full w-full object-cover transition-all duration-[900ms] ease-luxe ${
                    isActive ? 'scale-100 grayscale-0' : 'scale-105 grayscale'
                  }`}
                  loading="lazy"
                />
              )}
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
                {/* The title holds its place. Only its opacity and a small
                    lift change, so nothing reflows as the panel widens. */}
                <motion.h3
                  className="font-display text-xl italic text-ivory"
                  animate={{ y: isActive ? -4 : 0, opacity: isActive ? 1 : 0.8 }}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  {m.title}
                </motion.h3>

                {/* The body's space is reserved on every panel, so opening one
                    moves nothing. It is pinned to the open panel's width and
                    clipped, which keeps its line breaks identical whatever the
                    panel is currently doing. */}
                <div className="h-[7rem] overflow-hidden pt-2">
                  <motion.p
                    className="text-[0.8rem] leading-snug text-ivory/85"
                    style={{ width: COPY_WIDTH }}
                    animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 10 }}
                    transition={{
                      duration: 0.55,
                      ease: EASE,
                      delay: isActive ? 0.18 : 0,
                    }}
                  >
                    {m.body}
                  </motion.p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
