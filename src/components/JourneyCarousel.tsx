import { useCallback, useEffect, useRef, useState } from 'react'
import { asset } from '../lib/asset'
import { ChevronLeft, ChevronRight } from './ui/icons'

export interface Milestone {
  year: string
  title: string
  body: string
  /** False where the house has no photograph for that year yet. */
  art?: boolean
}

/**
 * The house's years, as an endless rail.
 *
 * The first attempt at this looped by animating a CSS transform over two copies
 * of the list. That drifted convincingly but was not actually endless: the
 * arrows scrolled the container underneath the animation, so pressing one
 * eventually arrived at the last card with empty space beyond it, which is
 * exactly what the client saw.
 *
 * So the drift and the arrows now share one mechanism. The rail is a scroller
 * holding three copies of the list, parked in the middle one. Everything that
 * moves it moves `scrollLeft`, and after every move the position is wrapped
 * back into the middle copy. Since each copy is identical, the wrap is
 * invisible, and there is no end to reach in either direction, by arrow, by
 * swipe or by drift.
 */

/** How fast the rail drifts when left alone, in pixels per second. */
const DRIFT_PX_PER_SECOND = 26

/** Cards an arrow travels. The client asked for two or three rather than one. */
const CARDS_PER_PRESS = 2.5

export default function JourneyCarousel({ milestones }: { milestones: Milestone[] }) {
  const rail = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [active, setActive] = useState<string | null>(null)

  // Three copies: one to show, one either side to wrap into.
  const loop = [...milestones, ...milestones, ...milestones]
  const copies = 3

  /** One copy's width, and the scroll position that sits at its start. */
  const metrics = useCallback(() => {
    const el = rail.current
    if (!el) return null
    const copyWidth = el.scrollWidth / copies
    return { copyWidth, start: copyWidth }
  }, [])

  /** Keep the position inside the middle copy, so neither end is reachable. */
  const wrap = useCallback(() => {
    const el = rail.current
    const m = metrics()
    if (!el || !m || m.copyWidth <= 0) return
    if (el.scrollLeft < m.copyWidth * 0.5) el.scrollLeft += m.copyWidth
    else if (el.scrollLeft > m.copyWidth * 1.5) el.scrollLeft -= m.copyWidth
  }, [metrics])

  // Start in the middle copy once the cards have a width.
  useEffect(() => {
    const el = rail.current
    const m = metrics()
    if (el && m) el.scrollLeft = m.start
  }, [metrics, milestones.length])

  /*
   * The drift. Moving scrollLeft rather than transforming a track means the
   * arrows, a swipe and the drift are all the same motion, so they cannot
   * fight each other or arrive at different places.
   */
  const [stillFrame, setStillFrame] = useState(false)
  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setStillFrame(q.matches)
    apply()
    q.addEventListener('change', apply)
    return () => q.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (paused || stillFrame) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const el = rail.current
      if (el) {
        el.scrollLeft += (DRIFT_PX_PER_SECOND * (now - last)) / 1000
        wrap()
      }
      last = now
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [paused, stillFrame, wrap])

  const nudge = useCallback((direction: 1 | -1) => {
    const el = rail.current
    if (!el) return
    const card = el.querySelector('button')
    const step = ((card as HTMLElement | null)?.offsetWidth ?? 240) + 12
    el.scrollBy({ left: direction * step * CARDS_PER_PRESS, behavior: 'smooth' })
    // Smooth scrolling lands after this returns, so the wrap waits for it.
    // Wrapping mid animation would jump the rail under the reader's eye.
    window.setTimeout(wrap, 600)
  }, [wrap])

  return (
    <div
      className="group/rail relative mt-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); setActive(null) }}
      onTouchStart={() => setPaused(true)}
    >
      <div
        ref={rail}
        onScroll={wrap}
        className="
          flex gap-3 overflow-x-auto pb-4
          [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
        "
      >
        {loop.map((m, i) => {
          const key = `${m.year}-${i}`
          const isActive = active === key
          return (
            <button
              key={key}
              onMouseEnter={() => setActive(key)}
              onFocus={() => { setPaused(true); setActive(key) }}
              onBlur={() => setActive(null)}
              aria-label={`${m.year}: ${m.title}`}
              className={`
                group relative h-[20rem] w-[13rem] shrink-0 overflow-hidden rounded-sm text-left
                transition-[width] duration-700 ease-luxe
                sm:h-[24rem] sm:w-[15rem] ${isActive ? 'sm:w-[19rem]' : ''}
              `}
            >
              {m.art === false ? (
                /* No photograph for this year yet, so the card carries the
                   house's own motif over a warm gold ground rather than
                   reading as a hole in the row. */
                <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-gold-deep via-[#6b4f1d] to-ink">
                  <div
                    className="peranakan absolute inset-0 opacity-25"
                    style={{ color: '#E8C97A' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/25" />
                  {/* A soft bloom, so the panel has some depth to it. */}
                  <div className="absolute left-1/2 top-1/3 h-40 w-40 -translate-x-1/2 rounded-full bg-gold/25 blur-3xl" />
                </div>
              ) : (
                <img
                  src={asset(`/assets/client/journey-${m.year}.webp`)}
                  alt=""
                  loading="lazy"
                  className={`h-full w-full object-cover transition-all duration-700 ease-luxe ${
                    isActive ? 'scale-100 grayscale-0' : 'scale-105 grayscale'
                  }`}
                />
              )}
              <div
                className={`absolute inset-0 transition-opacity duration-700 ${
                  isActive
                    ? 'bg-gradient-to-t from-gold-deep/90 via-gold-deep/25 to-transparent'
                    : 'bg-gradient-to-t from-ink/90 via-ink/40 to-ink/10'
                }`}
              />

              <span className="absolute left-5 top-4 font-minion text-2xl font-normal text-ivory/85">
                {m.year}
              </span>

              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="font-display text-lg italic leading-tight text-ivory">{m.title}</h3>
                {/* Reserved rather than animated open, so nothing below the
                    card shifts as the copy appears. */}
                <div
                  className={`h-[5.5rem] overflow-hidden pt-2 transition-opacity duration-500 ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <p className="text-[0.78rem] leading-snug text-ivory/85">{m.body}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Out on hover, and always there on touch, which has no hover to give. */}
      {([['left', -1], ['right', 1]] as const).map(([side, direction]) => (
        <button
          key={side}
          onClick={() => nudge(direction)}
          aria-label={side === 'left' ? 'Previous years' : 'Next years'}
          className={`
            absolute top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center
            rounded-full border border-ivory/25 bg-ink/70 text-ivory backdrop-blur
            transition-opacity duration-300 hover:bg-ink
            ${side === 'left' ? 'left-2' : 'right-2'}
            opacity-100 [@media(hover:hover)]:opacity-0
            [@media(hover:hover)]:group-hover/rail:opacity-100
          `}
        >
          {side === 'left' ? <ChevronLeft width={18} /> : <ChevronRight width={18} />}
        </button>
      ))}
    </div>
  )
}
