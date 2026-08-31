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
 * The house's years, as a moving rail.
 *
 * Client change: the panels used to share the width of the section, so eleven
 * of them squeezed each into a sliver and the photographs were unreadable. Each
 * card now keeps its own size and the row scrolls instead, looping so there is
 * no end to arrive at.
 *
 * The loop is a plain CSS translation over two copies of the list, which is
 * cheaper and far smoother than moving it from JavaScript on every frame: the
 * compositor owns it, so it does not stutter while React is busy elsewhere.
 * Resting a pointer on the rail pauses it and brings out an arrow at each end;
 * moving away hides them and the drift resumes. Touch has no hover, so there
 * the arrows are always available and the rail can simply be swiped.
 *
 * A visitor who prefers reduced motion gets no drift at all, just the arrows.
 */
export default function JourneyCarousel({ milestones }: { milestones: Milestone[] }) {
  const railRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [active, setActive] = useState<string | null>(null)

  // The rail holds the list twice, so the animation can travel exactly one
  // copy's width and snap back to the start without anything appearing to move.
  const loop = [...milestones, ...milestones]

  const [stillFrame, setStillFrame] = useState(false)
  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setStillFrame(q.matches)
    apply()
    q.addEventListener('change', apply)
    return () => q.removeEventListener('change', apply)
  }, [])

  const nudge = useCallback((direction: 1 | -1) => {
    const rail = railRef.current
    if (!rail) return
    // A card plus its gap, so an arrow moves the rail by exactly one panel.
    const step = (rail.firstElementChild as HTMLElement | null)?.offsetWidth ?? 260
    rail.scrollBy({ left: direction * (step + 12), behavior: 'smooth' })
  }, [])

  const drifting = !paused && !stillFrame

  return (
    <div
      className="group/rail relative mt-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); setActive(null) }}
    >
      {/* The rail is a real scroller, so a swipe works on touch and the arrows
          have something to scroll. The drift is a transform on the track
          inside it, which leaves the scroll position alone. */}
      <div
        ref={railRef}
        className="
          flex gap-3 overflow-x-auto pb-4
          [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
        "
      >
        <div
          className="flex shrink-0 gap-3"
          style={{
            animation: 'journey-drift 60s linear infinite',
            animationPlayState: drifting ? 'running' : 'paused',
          }}
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
                  transition-[width,transform] duration-700 ease-luxe
                  sm:h-[24rem] sm:w-[15rem] ${isActive ? 'sm:w-[19rem]' : ''}
                `}
              >
                {m.art === false ? (
                  /* 2026 has no photograph yet, so it carries the house's own
                     Peranakan pattern rather than a gap in the row. */
                  <div className="h-full w-full bg-gold-deep/25">
                    <div
                      className={`peranakan h-full w-full transition-opacity duration-700 ${
                        isActive ? 'opacity-30' : 'opacity-15'
                      }`}
                      style={{ color: '#CBAA5D' }}
                    />
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
