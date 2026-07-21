import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { collections } from '../data/collections'
import { accent } from '../lib/accents'
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

  return (
    <>
      {/* Desktop: pinned horizontal pan */}
      <section
        ref={wrapRef}
        className="relative hidden bg-ink text-ivory lg:block"
        style={{ height: `${maxX + (typeof window !== 'undefined' ? window.innerHeight : 900)}px` }}
      >
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-[0.04] peranakan" style={{ color: '#CBAA5D' }} />
          <motion.div ref={trackRef} style={{ x }} className="flex items-center gap-8 px-[7vw] will-change-transform">
            {/* Intro panel */}
            <div className="w-[34vw] shrink-0">
              <Kicker>The Collections</Kicker>
              <h2 className="mt-5 font-display text-[clamp(2.6rem,4.4vw,4.4rem)] leading-[1.02]">
                Four worlds,<br />bottled.
              </h2>
              <p className="mt-6 max-w-sm text-ivory/60">
                Each Legendary collection is a different memory of Malaysia — its heritage, its
                highlands, its islands. Scroll to wander through them.
              </p>
            </div>
            {collections.map((c, i) => (
              <RailCard key={c.id} c={c} index={i} />
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
          {collections.map((c, i) => (
            <div key={c.id} className="w-[78vw] shrink-0 snap-center">
              <RailCard c={c} index={i} />
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function RailCard({ c, index }: { c: (typeof collections)[number]; index: number }) {
  const tone = accent(c.accent)
  return (
    <Link
      to={`/shop?collection=${c.id}`}
      className="group relative block h-[64vh] w-[min(78vw,30rem)] shrink-0 overflow-hidden rounded-sm lg:w-[30rem]"
    >
      <img src={c.image} alt={c.name} className="h-full w-full object-cover transition-transform duration-[1200ms] ease-luxe group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
      <div className="absolute left-1 top-5">
        <span className="ml-6 font-display text-6xl text-ivory/15">0{index + 1}</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-7">
        <p className="eyebrow" style={{ color: tone.hex }}>{c.tagline}</p>
        <h3 className="mt-2 flex items-center gap-3 font-display text-4xl">
          {c.name}
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ivory/10 opacity-0 transition-all duration-500 group-hover:opacity-100">
            <ArrowUpRight width={18} />
          </span>
        </h3>
        <p className="mt-3 max-w-xs text-sm text-ivory/60">{c.description}</p>
      </div>
    </Link>
  )
}
