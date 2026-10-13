import { asset } from '../lib/asset'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import SplitText from '../components/ui/SplitText'
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight } from '../components/ui/icons'
import { useUI } from '../store/ui'

/**
 * The home hero: the house film, then the current campaign poster.
 *
 * Revision 10. The client asked for the two to run as a slideshow: the film
 * plays to its end, the poster holds for a few seconds, the film plays again,
 * and arrows move between them by hand. Revision 11 brought the balloon
 * artwork in place of the first anniversary poster; see POSTER.
 *
 * So the film no longer loops. Its own `ended` is what brings the poster in,
 * which means the poster never cuts across it partway through, and it starts
 * again from the top each time it comes round.
 *
 * Only the poster layer fades. The film stays underneath at full strength, so
 * the change in either direction is one picture dissolving over another rather
 * than both thinning out over the ink behind them.
 *
 * The headline and buttons belong to the film. A poster carries its own
 * lettering, and the headline over it would be both hard to read and in its
 * way, so they step aside while it is up. Over a light poster the header and
 * the arrows switch from ivory to ink.
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

/** Circumference of the countdown ring around the next arrow, r = 19.5. */
const RING = 2 * Math.PI * 19.5

/** A region of the artwork, as fractions of it: left, top, right, bottom. */
type Box = readonly [number, number, number, number]

/**
 * The poster now showing.
 *
 * Everything else follows from this entry: how the poster is cropped on each
 * shape of screen, and whether the header and arrows turn to ink over it. A new
 * campaign is a new entry here and a new save_hero_poster line in
 * prepare-assets.py, with a new name, since /assets/ is cached for a year and
 * an old name would keep showing the old poster to anyone who had seen it.
 *
 *   words    the lettering. It must stay whole, below the header and clear of
 *            the arrows.
 *   picture  the product shot. It should stay in frame too, and gives way to
 *            the words when the two cannot both be met.
 *
 * Measured off a 5% grid laid over the client's file.
 */
const POSTER = {
  name: 'balloon',
  /** The generated files' size, for the aspect ratio before one has loaded. */
  width: 3200,
  height: 1802,
  alt: 'Legendary’s 11th anniversary: a bottle of Legendary and a cake in the basket of a golden hot air balloon. The legend of scent.',
  /** A light poster turns the header and arrows to ink while it is up. */
  tone: 'light' as 'light' | 'dark',
  words: [0.515, 0.288, 0.928, 0.767] as Box,
  picture: [0.12, 0.41, 0.475, 0.955] as Box,
}

const posterFile = (variant: number | 'fill') => asset(`/assets/client/hero-${POSTER.name}-${variant}.webp`)

/**
 * How the poster meets the frame.
 *
 * cover  A desktop window is close enough to the poster's own 16:9 that it can
 *        fill the frame edge to edge. A frame narrower than the poster loses
 *        width, split so the picture on one side and the words on the other
 *        keep equal margins; it covers for as long as both keep at least 2% of
 *        the width, which for the balloon is down to about 1.5:1. A frame wider
 *        than the poster loses height instead, decided as described below.
 * band   A tablet or a squarish window. Covering it would cut into the words or
 *        the picture, so the poster is shown whole across the full width and
 *        set on the bottom edge. The space above sits behind the header, on a
 *        blurred field cut from the poster.
 * card   A phone held upright, where a 16:9 picture can only fill the screen by
 *        losing two thirds of its width. It is shown whole and centred on the
 *        same field instead, clear of the controls and the concierge button.
 *
 * The vertical cut, when there is one, keeps the words below the header and
 * above the arrows where the two overlap, and within that keeps the picture in
 * frame and below the header, splitting whatever room is left down the middle.
 * If the picture cannot be kept whole, the cut goes as near to it as the words
 * allow; if even the words cannot clear both, they stay clear of the arrows.
 *
 * Measured off the hero rather than the window, because the hero has a minimum
 * height and the two part company on a phone turned sideways.
 */
type Fit = 'cover' | 'band' | 'card'

/** Room kept between the poster's important parts and anything over them. */
const AIR = 12
/** The arrows wherever the poster can cover: 88px wide, 96px in from the right, top edge 76px up. */
const ARROWS = { width: 88, right: 96, top: 76 }

function frameFor(width: number, height: number): { fit: Fit; x: number; y: number } {
  const { words, picture } = POSTER
  const ratio = width / height
  const posterRatio = POSTER.width / POSTER.height

  // Narrower than the poster: the share of its width that would be lost,
  // against the room either side of the words and the picture together.
  const left = Math.min(words[0], picture[0])
  const right = Math.max(words[2], picture[2])
  const room = left + (1 - right)
  const widthLost = 1 - ratio / posterRatio
  if (widthLost > room - 0.04) return { fit: ratio >= 1 ? 'band' : 'card', x: 50, y: 50 }
  if (widthLost > 0) {
    const margin = (room - widthLost) / 2
    return { fit: 'cover', x: Math.round(((left - margin) / widthLost) * 100), y: 50 }
  }

  // Wider than the poster: how far down to start it, in px of its own height.
  const shown = width / posterRatio
  const excess = shown - height
  if (excess <= 0) return { fit: 'cover', x: 50, y: 50 }
  const at = (fraction: number) => fraction * shown
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0
  const arrowsLeft = (width - ARROWS.right - ARROWS.width) / width
  const arrowsRight = (width - ARROWS.right) / width
  const floor = arrowsLeft < words[2] && arrowsRight > words[0] ? height - ARROWS.top - AIR : height - AIR
  const lo = Math.max(0, at(words[3]) - floor)
  const hi = Math.min(excess, at(words[1]) - header - AIR)
  const pictureLo = Math.max(lo, at(picture[3]) - height)
  const pictureHi = Math.min(hi, at(picture[1]) - header - AIR)
  const cut =
    pictureLo <= pictureHi ? (pictureLo + pictureHi) / 2
    : lo <= hi ? Math.min(hi, Math.max(lo, pictureLo))
    : lo
  return { fit: 'cover', x: 50, y: Math.round((Math.min(excess, Math.max(0, cut)) / excess) * 100) }
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
  useEffect(() => setHeroTone(onPoster ? POSTER.tone : 'dark'), [onPoster, setHeroTone])
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

  const [frame, setFrame] = useState<{ fit: Fit; x: number; y: number }>({ fit: 'cover', x: 50, y: 50 })
  const { fit } = frame
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width && height) setFrame(frameFor(width, height))
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

  // Controls take the tone of what is behind them: ivory over the film, and
  // ink over a light poster.
  const light = onPoster && POSTER.tone === 'light'
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

      {/* The poster, dissolving in over the film */}
      <motion.div
        style={{ y }}
        aria-hidden={!onPoster}
        className={`absolute inset-0 transition-opacity duration-1000 ease-luxe ${
          onPoster ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {fit !== 'cover' && (
          <img
            src={posterFile('fill')}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className={`absolute inset-0 flex justify-center ${fit === 'card' ? 'items-center' : 'items-end'}`}>
          <img
            src={posterFile(2400)}
            srcSet={`${posterFile(1280)} 1280w, ${posterFile(2400)} 2400w, ${posterFile(3200)} 3200w`}
            sizes="100vw"
            width={POSTER.width}
            height={POSTER.height}
            decoding="async"
            alt={POSTER.alt}
            className={fit === 'cover' ? 'absolute inset-0 h-full w-full object-cover' : 'h-auto w-full'}
            style={
              fit === 'cover'
                ? { objectPosition: `${frame.x}% ${frame.y}%` }
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
