import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { collections } from '../data/collections'
import { accent } from '../lib/accents'
import Particles from '../components/ui/Particles'
import { Kicker } from '../components/ui/SplitText'
import { ArrowUpRight } from '../components/ui/icons'

/**
 * The client's collection covers are all square artboards, so the card is
 * square too and nothing is cropped.
 *
 * Client note: the copy sits on the photograph with no plate behind it, the
 * way their own 3 Wishes creative is set. Readability comes from a soft
 * vignette confined to the last third of the card plus a tight shadow on the
 * type, so the product still reads through the whole frame.
 *
 * The side is whichever is smaller: a comfortable 30rem, or the band left
 * between the fixed header and the foot of the screen once the rail's own
 * padding is taken off. That way the whole cover is always visible.
 */
const GUTTER = '3rem'
const CARD_SIDE = `min(30rem, calc(100vh - var(--header-h) - ${GUTTER} * 2))`
const CARD_SIDE_MOBILE = 'min(78vw, 26rem)'

/** Tight enough to lift the type off the photo without reading as a plate. */
const SHADOW = '0 1px 2px rgba(20,17,14,0.9), 0 2px 10px rgba(20,17,14,0.75)'

export default function CollectionsRail() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [maxX, setMaxX] = useState(0)

  useLayoutEffect(() => {
    const measure = () => {
      const track = trackRef.current
      if (!track) return
      setMaxX(Math.max(0, track.scrollWidth - window.innerWidth))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], [0, -maxX])

  // Client note: pan 15% slower. The same travel spread over a taller pinned
  // section means the viewer gets longer on each collection.
  const PACE = 1.15

  return (
    <>
      {/* Desktop: pinned horizontal pan */}
      <section
        ref={wrapRef}
        className="relative hidden bg-ink text-ivory lg:block"
        style={{ height: `${maxX * PACE + (typeof window !== 'undefined' ? window.innerHeight : 900)}px` }}
      >
        {/* Padded clear of the fixed header, with matching room at the foot, so
            each square cover sits fully inside the visible band */}
        <div
          className="sticky top-0 flex h-screen items-center overflow-hidden"
          style={{ paddingTop: `calc(var(--header-h) + ${GUTTER})`, paddingBottom: GUTTER }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.04] peranakan" style={{ color: '#CBAA5D' }} />
          <Particles />
          {/* Even gutters both ends so the first and last card sit inset
              rather than flush against the viewport edge */}
          <motion.div ref={trackRef} style={{ x }} className="relative z-10 flex items-center gap-10 px-[12vw] will-change-transform">
            {/* Intro panel */}
            <div className="w-[34vw] shrink-0">
              <Kicker>The Collections</Kicker>
              <h2 className="mt-5 font-display text-[clamp(2.6rem,4.4vw,4.4rem)] leading-[1.02]">
                Four worlds,<br />bottled.
              </h2>
              <p className="mt-6 max-w-sm text-ivory/60">
                Each Legendary collection is a different memory of Malaysia: its heritage, its
                highlands, its islands. Scroll to wander through them.
              </p>
            </div>
            {collections.map((c) => (
              <RailCard key={c.id} c={c} side={CARD_SIDE} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mobile: snap scroller */}
      <section className="bg-ink py-16 text-ivory lg:hidden">
        <div className="u-container">
          <Kicker>The Collections</Kicker>
          <h2 className="mt-4 font-display text-4xl">Four worlds, bottled.</h2>
        </div>
        <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4">
          {collections.map((c) => (
            <div key={c.id} className="shrink-0 snap-center" style={{ width: CARD_SIDE_MOBILE }}>
              <RailCard c={c} side={CARD_SIDE_MOBILE} />
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function RailCard({ c, side }: { c: (typeof collections)[number]; side: string }) {
  const tone = accent(c.accent)
  return (
    <Link
      to={`/shop?collection=${c.id}`}
      style={{ width: side, height: side }}
      className="group relative block shrink-0 overflow-hidden rounded-sm"
    >
      <img
        src={c.image}
        alt={c.name}
        className="h-full w-full object-cover transition-transform duration-[1200ms] ease-luxe group-hover:scale-105"
      />

      {/* A soft vignette, only across the last third, so the cover reads whole */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%]"
        style={{
          background:
            'linear-gradient(to top, rgba(20,17,14,0.86) 0%, rgba(20,17,14,0.66) 38%, rgba(20,17,14,0.28) 72%, rgba(20,17,14,0) 100%)',
        }}
      />

      <div className="absolute inset-x-0 bottom-0 p-7" style={{ textShadow: SHADOW }}>
        {/* The tagline is the smallest type here and can land on a highlight in
            the photograph, so it carries its own tighter shadow. */}
        <p
          className="eyebrow"
          style={{
            color: tone.onDark,
            fontWeight: 600,
            textShadow: '0 0 6px rgba(20,17,14,0.95), 0 1px 2px rgba(20,17,14,1)',
          }}
        >
          {c.tagline}
        </p>
        <h3 className="mt-1.5 flex items-center gap-3 font-display text-[clamp(1.9rem,2.4vw,2.4rem)] leading-none text-ivory">
          {c.name}
          <span className="grid h-8 w-8 place-items-center rounded-full bg-ivory/15 opacity-0 backdrop-blur-sm transition-all duration-500 group-hover:opacity-100">
            <ArrowUpRight width={17} />
          </span>
        </h3>
        <p className="mt-2 line-clamp-2 max-w-[24rem] text-sm leading-relaxed text-ivory/90">
          {c.description}
        </p>
      </div>
    </Link>
  )
}
