import { asset } from '../lib/asset'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import SplitText from '../components/ui/SplitText'
import { ArrowRight, ChevronDown } from '../components/ui/icons'

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[620px] w-full overflow-hidden bg-ink">
      {/* Media */}
      <motion.div style={{ y }} className="absolute inset-0 h-[120%]">
        <video
          className="h-full w-full object-cover"
          autoPlay muted loop playsInline
          poster={asset('/assets/client/signature-orchid.webp')}
        >
          <source src={asset('/assets/client/home-hero.mp4')} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/20 to-ink/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/50 to-transparent" />
      </motion.div>

      {/* Side label */}
      <div className="absolute left-6 top-1/2 hidden -translate-y-1/2 lg:block">
        <span className="writing-vertical text-[0.68rem] uppercase tracking-[0.3em] text-ivory/50">
          N°01 · The House of Legendary
        </span>
      </div>

      {/* Content — padded past the fixed header so the eyebrow never sits
          against the navigation on short viewports */}
      <motion.div
        style={{ y: textY, opacity, paddingTop: 'var(--header-h)' }}
        className="relative z-10 flex h-full items-center"
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

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2 text-ivory/60"
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
