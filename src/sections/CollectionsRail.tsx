import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { collections } from '../data/collections'
import { accent } from '../lib/accents'
import Particles from '../components/ui/Particles'
import { Kicker } from '../components/ui/SplitText'
import { ArrowUpRight } from '../components/ui/icons'

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
        {/* Padded clear of the fixed header, plus breathing room, so the cards
            are centred in the visible band instead of running under the nav */}
        <div
          className="sticky top-0 flex h-screen items-center overflow-hidden"
          style={{ paddingTop: 'calc(var(--header-h) + 2.5rem)', paddingBottom: '2.5rem' }}
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
              <RailCard key={c.id} c={c} />
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
            <div key={c.id} className="w-[78vw] shrink-0 snap-center">
              <RailCard c={c} />
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function RailCard({ c }: { c: (typeof collections)[number] }) {
  const tone = accent(c.accent)
  return (
    <Link
      to={`/shop?collection=${c.id}`}
      // Never taller than the band left between the header and the section foot
      style={{ height: 'min(64vh, calc(100vh - var(--header-h) - 8rem))' }}
      className="group relative block w-[min(78vw,30rem)] shrink-0 overflow-hidden rounded-sm lg:w-[30rem]"
    >
      <img src={c.image} alt={c.name} className="h-full w-full object-cover transition-transform duration-[1200ms] ease-luxe group-hover:scale-105" />
      {/* Deep enough at the foot that the frosted plate reads as a light veil
          over dark, keeping both the ivory copy and the accent tagline legible
          on the pale family photography. */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-transparent" />
      {/* Client note: copy sits on a white-transparency plate so it stays
          legible over the lighter family photography. */}
      <div className="absolute inset-x-4 bottom-4">
        <div className="plate-frost rounded-sm p-6">
          <p className="eyebrow" style={{ color: tone.hex }}>{c.tagline}</p>
          <h3 className="mt-2 flex items-center gap-3 font-display text-4xl text-ivory">
            {c.name}
            <span className="grid h-9 w-9 place-items-center rounded-full bg-ivory/15 opacity-0 transition-all duration-500 group-hover:opacity-100">
              <ArrowUpRight width={18} />
            </span>
          </h3>
          <p className="mt-3 max-w-xs text-sm text-ivory/80">{c.description}</p>
        </div>
      </div>
    </Link>
  )
}
