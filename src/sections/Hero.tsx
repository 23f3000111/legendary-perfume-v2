import { asset } from '../lib/asset'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import SplitText from '../components/ui/SplitText'
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight } from '../components/ui/icons'
import { useUI } from '../store/ui'

/**
 * The home hero: the house film, then the 11th anniversary poster.
 *
 * Revision 10. The client asked for the two to run as a slideshow: the film
 * plays to its end, the poster holds for a few seconds, the film plays again,
 * and arrows move between them by hand.
 *
 * So the film no longer loops. Its own `ended` is what brings the poster in,
 * which means the poster never cuts across it partway through, and it starts
 * again from the top each time it comes round.
 *
 * Only the poster layer fades. The film stays underneath at full strength, so
 * the change in either direction is one picture dissolving over another rather
 * than both thinning out over the ink behind them.
 *
 * The headline and buttons belong to the film. The poster carries its own
 * lettering, and ivory type over its cream would be both unreadable and in its
 * way, so they step aside while it is up, and the header switches to ink.
 */
const SLIDES = ['film', 'poster'] as const
type Slide = (typeof SLIDES)[number]

/** How long the poster holds before the film comes back. */
const POSTER_MS = 6000

/**
 * The film moves the show on by ending, and a film that is not playing never
 * ends: iOS refuses autoplay in Low Power Mode, and a slow connection can
 * stall it. If it has not moved for this long, the show moves on without it,
 * so the poster is never stranded behind a still frame.
 */
const STALL_MS = 5000

const poster = (width: number) => asset(`/assets/client/hero-anniversary-${width}.webp`)

/** Circumference of the countdown ring around the next arrow, r = 19.5. */
const RING = 2 * Math.PI * 19.5

/**
 * How the poster meets the frame.
 *
 * cover  A desktop window is close enough to the poster's own 16:9 that it can
 *        fill the frame edge to edge. Whatever is cropped comes mostly off the
 *        left, where the cake already runs out of the picture, and is weighted
 *        so the bottle on one side and the lettering on the other keep the
 *        same margin; at 1.5:1, the squarest frame that still covers, both
 *        clear the edge by about 2.5% of the width. A frame wider than the
 *        poster loses height instead; see coverY.
 * band   A tablet or a squarish window. Covering it would reach the bottle, so
 *        the poster is shown whole across the full width and set on the bottom
 *        edge, which is where the cake is cut in the artwork itself. The space
 *        above sits behind the header, on a blurred field cut from the poster.
 * card   A phone held upright, where a 16:9 picture can only fill the screen by
 *        losing two thirds of its width, and with it the cake or the words. It
 *        is shown whole and centred on the same field instead, clear of the
 *        controls and the concierge button below it.
 *
 * Measured off the hero rather than the window, because the hero has a minimum
 * height and the two part company on a phone turned sideways.
 */
type Fit = 'cover' | 'band' | 'card'
const fitFor = (width: number, height: number): Fit => {
  const ratio = width / height
  return ratio >= 1.5 ? 'cover' : ratio >= 1 ? 'band' : 'card'
}

/*
 * Where a covering poster is cut vertically, as an object-position y.
 *
 * Only a frame wider than 16:9 loses height, and two things decide where it
 * comes from. The candle flame is the highest thing in the picture and should
 * come out below the header rather than up among the navigation, which a fixed
 * cut put it right into on a short laptop window. And the lettering's last line
 * should stay clear of the arrows, which on an ultrawide screen it otherwise
 * runs down into. Within what both allow the cut is split down the middle; if
 * they cannot both be met, the lettering wins.
 */
const POSTER_RATIO = 3200 / 1799
/** Tip of the candle flame, as a fraction of the artwork's height. */
const FLAME_TOP = 0.17
/** Foot of "It's our 11th Anniversary!", likewise. */
const LETTERING_FOOT = 0.72
/** The arrows' top edge sits 76px above the bottom of the hero; plus air. */
const ARROWS_CLEARANCE = 96

function coverY(width: number, height: number): number {
  const rendered = width / POSTER_RATIO
  const excess = rendered - height
  if (excess <= 0) return 0
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0
  const most = FLAME_TOP * rendered - header - 12
  const least = LETTERING_FOOT * rendered - (height - ARROWS_CLEARANCE)
  const lo = Math.max(0, least)
  const hi = Math.min(excess, most)
  const top = Math.min(excess, lo <= hi ? (lo + hi) / 2 : lo)
  return Math.round((top / excess) * 100)
}

/** Feathered edges, so a poster shown whole melts into its field. */
const FEATHER: Record<Exclude<Fit, 'cover'>, string> = {
  band: 'linear-gradient(to bottom, transparent, #000 10%)',
  card: 'linear-gradient(to bottom, transparent, #000 10%, #000 90%, transparent)',
}

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const copy = useRef<HTMLDivElement>(null)
  const controls = useRef<HTMLDivElement>(null)

  const [index, setIndex] = useState(0)
  const slide: Slide = SLIDES[index]
  const onPoster = slide === 'poster'
  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), [])
  const prev = useCallback(() => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length), [])

  /*
   * Persuade iOS to play the background clip.
   *
   * Safari only autoplays a video that is muted and inline, and React sets
   * `muted` as a property rather than an attribute, which iOS has historically
   * not honoured on an element it has yet to see play. Setting both is what
   * makes it start; the play itself is asked for below, as the film's slide
   * comes up.
   */
  useEffect(() => {
    const el = video.current
    if (!el) return
    el.muted = true
    el.setAttribute('muted', '')
    el.playsInline = true
  }, [])

  // Nothing times out while nobody is looking at the tab.
  const [hidden, setHidden] = useState(() => document.hidden)
  useEffect(() => {
    const onChange = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  // The header reads this to stay legible over the poster.
  const setHeroTone = useUI((s) => s.setHeroTone)
  useEffect(() => setHeroTone(onPoster ? 'light' : 'dark'), [onPoster, setHeroTone])
  useEffect(() => () => setHeroTone('dark'), [setHeroTone])

  /*
   * Entering a slide. The film restarts from the top whenever it comes round,
   * and rests while the poster is up rather than playing unseen beneath it.
   * The play attempt is allowed to fail: Low Power Mode and Reduce Motion both
   * refuse autoplay outright, its own poster frame stands in, and STALL_MS
   * keeps the show moving.
   */
  const entered = useRef(false)
  useEffect(() => {
    const el = video.current
    if (!el) return
    if (slide === 'film') {
      if (entered.current) el.currentTime = 0
      void el.play().catch(() => {})
    } else {
      el.pause()
    }
    entered.current = true
  }, [slide])

  // Moving on: the poster after its few seconds, the film when it ends.
  useEffect(() => {
    if (hidden) return
    if (slide === 'poster') {
      const timer = window.setTimeout(next, POSTER_MS)
      return () => window.clearTimeout(timer)
    }
    const el = video.current
    if (!el) return
    let moved = performance.now()
    const onMove = () => { moved = performance.now() }
    el.addEventListener('ended', next)
    el.addEventListener('timeupdate', onMove)
    // Back from a hidden tab, which may have paused it.
    void el.play().catch(() => {})
    const watch = window.setInterval(() => {
      if (performance.now() - moved > STALL_MS) next()
    }, 500)
    return () => {
      el.removeEventListener('ended', next)
      el.removeEventListener('timeupdate', onMove)
      window.clearInterval(watch)
    }
  }, [slide, hidden, next])

  /*
   * The ring around the next arrow: how far through the film, or how much of
   * the poster's hold has gone, so it is plain the show moves on by itself.
   * One frame loop writes a single custom property, so nothing re-renders to
   * draw it.
   */
  useEffect(() => {
    if (hidden) return
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const el = video.current
      const done =
        slide === 'poster'
          ? (now - start) / POSTER_MS
          : el && el.duration
            ? el.currentTime / el.duration
            : 0
      controls.current?.style.setProperty('--progress', Math.min(1, Math.max(0, done)).toFixed(4))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [slide, hidden])

  // The headline's buttons stay out of the tab order while they are hidden.
  useEffect(() => {
    copy.current?.toggleAttribute('inert', onPoster)
  }, [onPoster])

  const [{ fit, y: cutY }, setFrame] = useState<{ fit: Fit; y: number }>({ fit: 'cover', y: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width && height) setFrame({ fit: fitFor(width, height), y: coverY(width, height) })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // A sideways swipe moves the show on a phone. Anything mostly vertical is
  // left alone, so it is still a scroll.
  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current
    touch.current = null
    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? next : prev)()
  }

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  // Controls take the tone of what is behind them: ivory over the film, ink
  // over the poster's cream.
  const light = onPoster
  // Hover only where there is a pointer to hover with: iOS keeps it stuck on
  // whatever was last tapped.
  const ring = light
    ? 'border-ink/20 bg-ivory/45 text-ink [@media(hover:hover)]:hover:bg-ivory/80'
    : 'border-ivory/30 bg-ink/25 text-ivory [@media(hover:hover)]:hover:bg-ink/55'

  return (
    <section
      ref={ref}
      aria-roledescription="carousel"
      aria-label="Legendary"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="relative h-[100svh] min-h-[620px] w-full overflow-hidden bg-ink [touch-action:pan-y_pinch-zoom]"
    >
      {/* The film */}
      <motion.div style={{ y }} className="absolute inset-0 h-[120%]">
        <video
          ref={video}
          className="h-full w-full object-cover"
          autoPlay
          muted
          playsInline
          // Safari wants this spelling as well as the camel-cased prop.
          // eslint-disable-next-line react/no-unknown-property
          webkit-playsinline="true"
          preload="metadata"
          aria-hidden
          poster={asset('/assets/client/signature-orchid.webp')}
        >
          <source src={asset('/assets/client/home-hero.mp4')} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/20 to-ink/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/50 to-transparent" />
      </motion.div>

      {/* The anniversary poster, dissolving in over the film */}
      <motion.div
        style={{ y }}
        aria-hidden={!onPoster}
        className={`absolute inset-0 transition-opacity duration-1000 ease-luxe ${
          onPoster ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {fit !== 'cover' && (
          <img
            src={asset('/assets/client/hero-anniversary-fill.webp')}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className={`absolute inset-0 flex justify-center ${fit === 'card' ? 'items-center' : 'items-end'}`}>
          <img
            src={poster(2400)}
            srcSet={`${poster(1280)} 1280w, ${poster(2400)} 2400w, ${poster(3200)} 3200w`}
            sizes="100vw"
            width={3200}
            height={1799}
            decoding="async"
            alt="Legendary’s 11th anniversary: 11 Years of Scent Memories"
            className={fit === 'cover' ? 'absolute inset-0 h-full w-full object-cover' : 'h-auto w-full'}
            style={
              fit === 'cover'
                ? { objectPosition: `82% ${cutY}%` }
                : { WebkitMaskImage: FEATHER[fit], maskImage: FEATHER[fit] }
            }
          />
        </div>
      </motion.div>

      {/* Everything that belongs to the film, which steps aside for the poster */}
      <div
        ref={copy}
        className={`absolute inset-0 z-10 transition-opacity duration-700 ease-luxe ${
          onPoster ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        {/* Side label */}
        <div className="absolute left-6 top-1/2 hidden -translate-y-1/2 lg:block">
          <span className="writing-vertical text-[0.68rem] uppercase tracking-[0.3em] text-ivory/50">
            N°01 · The House of Legendary
          </span>
        </div>

        {/* Content, padded past the fixed header so the eyebrow never sits
            against the navigation on short viewports.

            On a phone the headline runs the full width and its buttons come
            within a few pixels of the bottom on a short screen, so it also
            centres above a band kept clear for the arrows and the concierge
            button. Measured down to 360x640 and 375x620. Wider screens keep it
            on the left, where the bottom right never meets it. */}
        <motion.div
          style={{ y: textY, opacity, paddingTop: 'var(--header-h)' }}
          className="relative flex h-full items-center pb-[5.25rem] md:pb-0"
        >
          <div className="u-container">
            <div className="max-w-3xl">
              <motion.p
                className="eyebrow eyebrow-gold"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.9 }}
              >
                Est. 2015 · Kuala Lumpur, Malaysia
              </motion.p>

              <h1 className="mt-6 font-display text-[clamp(2.8rem,7.5vw,6.4rem)] font-light leading-[0.98] text-ivory">
                <SplitText text="A Scented Memory" /> <br />
                <span className="italic text-gilt"><SplitText text="of Malaysia" delay={0.35} /></span>
              </h1>

              <motion.p
                className="mt-7 max-w-xl text-lg text-ivory/75"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 1 }}
              >
                An artisanal perfume house capturing the rich soul and heritage of Malaysia, from
                wild rainforest flora to comforting cultural delights.
              </motion.p>

              <motion.div
                className="mt-10 flex flex-wrap items-center gap-4"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 1 }}
              >
                <Link to="/shop" className="btn-gold group">
                  Explore Fragrances
                  <ArrowRight width={16} className="transition-transform duration-500 group-hover:translate-x-1" />
                </Link>
                <Link to="/product/orchid" className="btn-outline-light group">
                  Discover Orchid
                  <ArrowRight width={16} className="transition-transform duration-500 group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* The arrows. Revision 10: the client asked for them on the right after
          seeing them over the headline's buttons, which on a shorter window
          come right down to the bottom left. They sit on the concierge
          button's line, just inside it: the headline lives on the left, and the
          poster's lettering stops well above. */}
      <div ref={controls} className="absolute bottom-7 right-[5.5rem] z-20 flex items-center gap-2 md:bottom-9 md:right-24">
        <button
          onClick={prev}
          aria-label="Previous slide"
          className={`grid h-10 w-10 place-items-center rounded-full border backdrop-blur-sm transition-colors duration-700 ${ring}`}
        >
          <ChevronLeft width={18} />
        </button>
        <button
          onClick={next}
          aria-label="Next slide"
          className={`relative grid h-10 w-10 place-items-center rounded-full border backdrop-blur-sm transition-colors duration-700 ${ring}`}
        >
          <svg viewBox="0 0 40 40" aria-hidden className="pointer-events-none absolute -left-px -top-px h-[42px] w-[42px] -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="19.5"
              fill="none"
              strokeWidth="1.5"
              className={`transition-colors duration-700 ${light ? 'stroke-gold-deep' : 'stroke-gold'}`}
              style={{ strokeDasharray: RING, strokeDashoffset: `calc(${RING}px * (1 - var(--progress, 0)))` }}
            />
          </svg>
          <ChevronRight width={18} />
        </button>
      </div>

      {/* Scroll cue. Not on a phone, where the arrows would run into it. */}
      <motion.div
        className={`absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 transition-colors duration-700 sm:block ${
          light ? 'text-ink/50' : 'text-ivory/60'
        }`}
        animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-[0.6rem] uppercase tracking-[0.3em]">Scroll</span>
          <ChevronDown width={18} />
        </div>
      </motion.div>
    </section>
  )
}
